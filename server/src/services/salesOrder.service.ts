import { Types } from 'mongoose';
import {
  SalesOrder,
  ISalesOrder,
  Customer,
  Product,
  Invoice,
  IInvoice,
  Payment,
  IPayment,
  AuditLog,
  StockMovement,
  getNextSequence
} from '../models';
import { StockLedgerService } from './stockLedger.service';
import { WhatsAppService } from './whatsapp.service';
import { RealtimeService } from './realtime.service';
import {
  rupeesToPaise,
  paiseToRupees,
  calculateGSTPaise,
  validatePaymentPaise
} from '../utils/money';
import { convert } from '../utils/units';

export interface CreateOrderParams {
  tenantId?: string;
  customerId: string;
  salesmanName?: string;
  salesmanId?: string;
  userRole?: string;
  items: Array<{
    productCode: string;
    quantity: number;
    unitPrice?: number;
    unit?: string;
  }>;
  offlineSyncId?: string;
  notes?: string;
}

export class SalesOrderService {
  /**
   * Creates a new sales order with automated stock availability check.
   * Preserves customer's requested quantity even during shortage.
   */
  static async createOrder(params: CreateOrderParams): Promise<ISalesOrder> {
    const customer = await Customer.findById(params.customerId);
    if (!customer) throw new Error(`Customer with ID ${params.customerId} not found`);

    const tenantId = params.tenantId || customer.tenantId || 'TENANT_NASH_FOODS';

    // Idempotent deduplication for offline sync
    if (params.offlineSyncId) {
      const existing = await SalesOrder.findOne({ tenantId, offlineSyncId: params.offlineSyncId });
      if (existing) return existing;
    }

    const seq = await getNextSequence(tenantId, 'ORDER');
    const orderNumber = `SO-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

    const orderItems: any[] = [];
    let totalAmountPaise = 0;
    let minAvailableStock = Infinity;
    let totalShortage = 0;
    let isSufficient = true;

    for (const item of params.items) {
      const product = await Product.findOne({
        tenantId,
        code: item.productCode.toUpperCase()
      }) || await Product.findOne({ code: item.productCode.toUpperCase() });

      if (!product) throw new Error(`Product with code ${item.productCode} not found`);

      let quantityInPackets = item.quantity;
      const packetsPerCarton = product.packetsPerCarton || 20;
      if (item.unit && (item.unit.toLowerCase().startsWith('carton') || item.unit.toLowerCase().startsWith('box'))) {
        quantityInPackets = convert(item.quantity, 'carton', 'packet', { packetsPerCarton });
      }

      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice;
      const unitPricePaise = rupeesToPaise(unitPrice);
      const lineTotalPaise = quantityInPackets * unitPricePaise;
      const lineTotal = paiseToRupees(lineTotalPaise);
      totalAmountPaise += lineTotalPaise;

      const availableStock = product.currentStock;
      if (availableStock < minAvailableStock) minAvailableStock = availableStock;

      if (availableStock < quantityInPackets) {
        isSufficient = false;
        totalShortage += (quantityInPackets - availableStock);
      }

      orderItems.push({
        productId: product._id,
        productCode: product.code,
        productName: product.name,
        quantity: quantityInPackets,
        unitPrice,
        unitPricePaise,
        lineTotal,
        lineTotalPaise
      });
    }

    const totalAmount = paiseToRupees(totalAmountPaise);

    const order = new SalesOrder({
      tenantId,
      orderNumber,
      salesmanId: params.salesmanId ? new Types.ObjectId(params.salesmanId) : undefined,
      salesmanName: params.salesmanName || 'Field Salesman',
      customerId: customer._id,
      customerCode: customer.code,
      customerName: customer.name,
      customerState: customer.state,
      customerStateCode: customer.stateCode,
      items: orderItems,
      totalAmount,
      totalAmountPaise,
      status: 'SUBMITTED',
      offlineSyncId: params.offlineSyncId,
      stockCheck: {
        availableStock: minAvailableStock === Infinity ? 0 : minAvailableStock,
        isSufficient,
        shortageQuantity: totalShortage
      },
      notes: params.notes,
      createdAt: new Date()
    });

    await order.save();

    await AuditLog.create({
      tenantId,
      action: 'SALES_ORDER_CREATED',
      entityType: 'SalesOrder',
      entityId: order._id.toString(),
      performedBy: params.salesmanName || 'Field Salesman',
      role: params.userRole || 'salesman',
      details: {
        orderNumber,
        customerName: customer.name,
        totalAmount,
        totalAmountPaise,
        isSufficient,
        shortageQuantity: totalShortage
      }
    });

    RealtimeService.broadcast('ORDER_CREATED', order);
    return order;
  }

  /**
   * Rejects a sales order with an audit reason.
   */
  static async rejectOrder(
    orderId: string,
    reason: string = 'Administrative decision',
    rejectedBy: string = 'Admin',
    rejecterRole: string = 'admin'
  ): Promise<ISalesOrder> {
    const order = await SalesOrder.findById(orderId);
    if (!order) throw new Error(`Sales order ${orderId} not found`);

    if (order.status !== 'SUBMITTED') {
      throw new Error(`Order ${order.orderNumber} is already ${order.status}`);
    }

    order.status = 'REJECTED';
    order.notes = (order.notes ? order.notes + ' | ' : '') + `Rejected: ${reason}`;
    await order.save();

    await AuditLog.create({
      tenantId: order.tenantId,
      action: 'SALES_ORDER_REJECTED',
      entityType: 'SalesOrder',
      entityId: order._id.toString(),
      performedBy: rejectedBy,
      role: rejecterRole,
      details: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        reason
      }
    });

    RealtimeService.broadcast('ORDER_REJECTED', { orderId, reason });
    return order;
  }

  /**
   * Approves a sales order and generates a GST-compliant tax invoice using integer paise math.
   */
  static async approveOrder(
    orderId: string,
    approverName: string = 'Admin',
    approverRole: string = 'admin'
  ): Promise<{ order: ISalesOrder; invoice: IInvoice }> {
    const order = await SalesOrder.findById(orderId);
    if (!order) throw new Error(`Sales order ${orderId} not found`);

    if (order.status !== 'SUBMITTED') {
      throw new Error(`Order ${order.orderNumber} is already ${order.status}`);
    }

    const customer = await Customer.findById(order.customerId);
    if (!customer) throw new Error('Customer not found');

    const factoryState = 'Tamil Nadu';
    const isInterState = customer.state.trim().toLowerCase() !== factoryState.toLowerCase();

    const tenantId = order.tenantId || process.env.DEFAULT_TENANT_ID || 'TENANT_NASH_FOODS';
    const financialYear = '2024-25';
    const invoiceSeq = await getNextSequence(tenantId, `INVOICE:${financialYear}`);
    const invoiceNumber = `INV/${financialYear}/${String(invoiceSeq).padStart(3, '0')}`;

    const invoiceItems: any[] = [];
    let taxableValuePaise = 0;
    let cgstTotalPaise = 0;
    let sgstTotalPaise = 0;
    let igstTotalPaise = 0;
    let grandTotalPaise = 0;

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      const hsnCode = product ? product.hsnCode : '19059040';
      const unitPricePaise = item.unitPricePaise || rupeesToPaise(item.unitPrice);
      const itemTaxablePaise = item.quantity * unitPricePaise;

      const gstRate = 5; // standard food rate for Murukku 200g
      const gst = calculateGSTPaise(itemTaxablePaise, gstRate, isInterState);

      taxableValuePaise += gst.taxablePaise;
      cgstTotalPaise += gst.cgstPaise;
      sgstTotalPaise += gst.sgstPaise;
      igstTotalPaise += gst.igstPaise;
      grandTotalPaise += gst.grandTotalPaise;

      invoiceItems.push({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitPricePaise,
        taxableAmount: paiseToRupees(gst.taxablePaise),
        taxableAmountPaise: gst.taxablePaise,
        cgstRate: isInterState ? 0 : 2.5,
        cgstAmount: paiseToRupees(gst.cgstPaise),
        cgstAmountPaise: gst.cgstPaise,
        sgstRate: isInterState ? 0 : 2.5,
        sgstAmount: paiseToRupees(gst.sgstPaise),
        sgstAmountPaise: gst.sgstPaise,
        igstRate: isInterState ? 5 : 0,
        igstAmount: paiseToRupees(gst.igstPaise),
        igstAmountPaise: gst.igstPaise,
        totalAmount: paiseToRupees(gst.grandTotalPaise),
        totalAmountPaise: gst.grandTotalPaise
      });
    }

    const taxableValue = paiseToRupees(taxableValuePaise);
    const cgstTotal = paiseToRupees(cgstTotalPaise);
    const sgstTotal = paiseToRupees(sgstTotalPaise);
    const igstTotal = paiseToRupees(igstTotalPaise);
    const grandTotal = paiseToRupees(grandTotalPaise);

    const invoice = new Invoice({
      tenantId,
      invoiceNumber,
      salesOrderId: order._id,
      customerId: customer._id,
      customerCode: customer.code,
      customerName: customer.name,
      customerGstin: customer.gstin,
      customerState: customer.state,
      customerStateCode: customer.stateCode,
      factoryState,
      placeOfSupply: `${customer.state} (${customer.stateCode})`,
      isInterState,
      items: invoiceItems,
      taxableValue,
      taxableValuePaise,
      cgstTotal,
      cgstTotalPaise,
      sgstTotal,
      sgstTotalPaise,
      igstTotal,
      igstTotalPaise,
      grandTotal,
      grandTotalPaise,
      paidAmount: 0,
      paidAmountPaise: 0,
      balanceDue: grandTotal,
      balanceDuePaise: grandTotalPaise,
      paymentStatus: 'UNPAID',
      isDispatched: false,
      createdAt: new Date()
    });

    await invoice.save();

    // Update customer outstanding balance with exact paise precision
    const currentCustBalPaise = customer.outstandingBalancePaise || rupeesToPaise(customer.outstandingBalance);
    const updatedCustBalPaise = currentCustBalPaise + grandTotalPaise;
    customer.outstandingBalancePaise = updatedCustBalPaise;
    customer.outstandingBalance = paiseToRupees(updatedCustBalPaise);
    await customer.save();

    order.status = 'INVOICED';
    order.invoiceId = invoice._id;
    await order.save();

    await AuditLog.create({
      tenantId,
      action: 'ORDER_APPROVED_AND_INVOICED',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      performedBy: approverName,
      role: approverRole,
      details: {
        orderNumber: order.orderNumber,
        invoiceNumber,
        taxableValue,
        cgstTotal,
        sgstTotal,
        igstTotal,
        grandTotal,
        grandTotalPaise
      }
    });

    // WhatsApp Notification Trigger via OpenWA
    try {
      await WhatsAppService.onOrderApproved(order, customer);
      await WhatsAppService.onInvoiceRaised(invoice);
    } catch (e) {
      console.warn('[WhatsApp] Failed to dispatch order/invoice notification:', e);
    }

    RealtimeService.broadcast('ORDER_APPROVED', { order, invoice });
    return { order, invoice };
  }

  /**
   * Dispatches an invoiced order:
   * Deducts finished goods stock via StockMovement (SALES_DISPATCH)
   */
  static async dispatchOrder(
    invoiceId: string,
    dispatcherName: string = 'Admin',
    dispatcherRole: string = 'admin'
  ): Promise<IInvoice> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (invoice.isDispatched) {
      throw new Error(`Invoice ${invoice.invoiceNumber} is already dispatched`);
    }

    const tenantId = invoice.tenantId || 'TENANT_NASH_FOODS';

    for (const item of invoice.items) {
      const product = await Product.findOne({ _id: item.productId, tenantId }) || await Product.findById(item.productId);
      if (!product) continue;

      if (product.currentStock < item.quantity) {
        throw new Error(
          `Cannot dispatch: insufficient finished goods stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`
        );
      }

      // FEFO (First Expiry First Out) Batch Allocation
      const batchReceipts = await StockMovement.find({
        tenantId,
        itemId: product._id,
        itemType: 'FINISHED_GOOD',
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1, createdAt: 1 }).lean();

      let remainingToDispatch = item.quantity;
      const allocatedBatches: string[] = [];

      for (const receipt of batchReceipts) {
        if (remainingToDispatch <= 0) break;
        const batchTag = receipt.batchNumber || 'OPENING-BATCH';

        const dispatchesFromBatch = await StockMovement.aggregate([
          {
            $match: {
              tenantId,
              itemId: product._id,
              batchNumber: receipt.batchNumber,
              movementType: 'SALES_DISPATCH'
            }
          },
          { $group: { _id: null, total: { $sum: '$quantity' } } }
        ]);
        const alreadyDispatched = dispatchesFromBatch.length > 0 ? Math.abs(dispatchesFromBatch[0].total) : 0;
        const availableInBatch = Math.max(0, receipt.quantity - alreadyDispatched);

        if (availableInBatch > 0) {
          const allocQty = Math.min(remainingToDispatch, availableInBatch);
          allocatedBatches.push(`${batchTag} (${allocQty} pkts)`);
          remainingToDispatch -= allocQty;
        }
      }

      const fefoNote = allocatedBatches.length > 0
        ? ` | FEFO Batches: ${allocatedBatches.join(', ')}`
        : '';

      await StockLedgerService.recordMovement({
        tenantId,
        itemType: 'FINISHED_GOOD',
        itemId: product._id,
        itemCode: product.code,
        itemName: `${product.name} (${product.packSize})`,
        movementType: 'SALES_DISPATCH',
        quantity: -item.quantity,
        unit: product.unit,
        unitCost: item.unitPrice,
        sourceDocType: 'INVOICE',
        sourceDocId: invoice.invoiceNumber,
        notes: `Dispatch for Invoice ${invoice.invoiceNumber} to ${invoice.customerName}${fefoNote}`,
        createdBy: dispatcherName
      });
    }

    invoice.isDispatched = true;
    invoice.dispatchDate = new Date();
    await invoice.save();

    await SalesOrder.findByIdAndUpdate(invoice.salesOrderId, { status: 'DISPATCHED' });

    await AuditLog.create({
      tenantId,
      action: 'ORDER_DISPATCHED',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      performedBy: dispatcherName,
      role: dispatcherRole,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        itemsCount: invoice.items.length
      }
    });

    // WhatsApp Dispatch Notification Trigger
    try {
      await WhatsAppService.onDispatch(invoice);
    } catch (e) {
      console.warn('[WhatsApp] Failed to dispatch shipment alert:', e);
    }

    RealtimeService.broadcast('ORDER_DISPATCHED', { invoice });
    return invoice;
  }

  /**
   * Records a payment against an invoice and recalculates customer outstanding balance with paise invariants
   */
  static async recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    receivedBy?: string;
    userRole?: string;
  }): Promise<{ payment: IPayment; invoice: IInvoice; customer: any }> {
    const invoice = await Invoice.findById(params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    const customer = await Customer.findById(invoice.customerId);
    if (!customer) throw new Error('Customer not found');

    const tenantId = invoice.tenantId || 'TENANT_NASH_FOODS';

    const paymentAmountPaise = rupeesToPaise(params.amount);
    const balanceDuePaise = invoice.balanceDuePaise || rupeesToPaise(invoice.balanceDue);

    const validation = validatePaymentPaise(balanceDuePaise, paymentAmountPaise);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid payment amount');
    }

    const seq = await getNextSequence(tenantId, 'PAYMENT');
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(seq).padStart(3, '0')}`;

    const payment = new Payment({
      tenantId,
      paymentNumber,
      customerId: customer._id,
      customerCode: customer.code,
      customerName: customer.name,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount: params.amount,
      amountPaise: paymentAmountPaise,
      paymentMethod: params.paymentMethod || 'BANK_TRANSFER',
      reference: params.reference,
      notes: params.notes,
      date: new Date()
    });

    await payment.save();

    // Update Invoice balances in paise
    const currentPaidPaise = invoice.paidAmountPaise || rupeesToPaise(invoice.paidAmount);
    const newPaidPaise = currentPaidPaise + paymentAmountPaise;
    const newBalanceDuePaise = validation.newBalanceDuePaise;

    invoice.paidAmountPaise = newPaidPaise;
    invoice.paidAmount = paiseToRupees(newPaidPaise);
    invoice.balanceDuePaise = newBalanceDuePaise;
    invoice.balanceDue = paiseToRupees(newBalanceDuePaise);
    invoice.paymentStatus = newBalanceDuePaise === 0 ? 'PAID' : 'PARTIALLY_PAID';
    await invoice.save();

    // Update Customer outstanding balance in paise
    const currentCustBalPaise = customer.outstandingBalancePaise || rupeesToPaise(customer.outstandingBalance);
    const newCustBalPaise = Math.max(0, currentCustBalPaise - paymentAmountPaise);
    customer.outstandingBalancePaise = newCustBalPaise;
    customer.outstandingBalance = paiseToRupees(newCustBalPaise);
    await customer.save();

    await AuditLog.create({
      tenantId,
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      performedBy: params.receivedBy || 'Senior Accountant',
      role: params.userRole || 'accountant',
      details: {
        paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customer.name,
        amount: params.amount,
        amountPaise: paymentAmountPaise,
        remainingInvoiceBalance: invoice.balanceDue,
        remainingCustomerOutstanding: customer.outstandingBalance
      }
    });

    // WhatsApp Payment Receipt Notification Trigger
    try {
      await WhatsAppService.onPaymentReceived(payment, invoice, customer);
    } catch (e) {
      console.warn('[WhatsApp] Failed to dispatch payment receipt:', e);
    }

    RealtimeService.broadcast('PAYMENT_RECORDED', { payment, invoice, customer });
    return { payment, invoice, customer };
  }
}
