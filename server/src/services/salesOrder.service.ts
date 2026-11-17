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
  AuditLog 
} from '../models';
import { StockLedgerService } from './stockLedger.service';

export interface CreateOrderParams {
  customerId: string;
  salesmanName?: string;
  salesmanId?: string;
  items: Array<{
    productCode: string;
    quantity: number;
    unitPrice?: number;
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
    // Idempotent deduplication for offline sync
    if (params.offlineSyncId) {
      const existing = await SalesOrder.findOne({ offlineSyncId: params.offlineSyncId });
      if (existing) return existing;
    }

    const customer = await Customer.findById(params.customerId);
    if (!customer) throw new Error(`Customer with ID ${params.customerId} not found`);

    const count = await SalesOrder.countDocuments();
    const orderNumber = `SO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const orderItems: any[] = [];
    let totalAmount = 0;
    let minAvailableStock = Infinity;
    let totalShortage = 0;
    let isSufficient = true;

    for (const item of params.items) {
      const product = await Product.findOne({ code: item.productCode.toUpperCase() });
      if (!product) throw new Error(`Product with code ${item.productCode} not found`);

      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice;
      const lineTotal = Math.round(item.quantity * unitPrice * 100) / 100;
      totalAmount += lineTotal;

      const availableStock = product.currentStock;
      if (availableStock < minAvailableStock) minAvailableStock = availableStock;

      if (availableStock < item.quantity) {
        isSufficient = false;
        totalShortage += (item.quantity - availableStock);
      }

      orderItems.push({
        productId: product._id,
        productCode: product.code,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal
      });
    }

    const order = new SalesOrder({
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
      action: 'SALES_ORDER_CREATED',
      entityType: 'SalesOrder',
      entityId: order._id.toString(),
      performedBy: params.salesmanName || 'Field Salesman',
      role: 'salesman',
      details: {
        orderNumber,
        customerName: customer.name,
        totalAmount,
        isSufficient,
        shortageQuantity: totalShortage
      }
    });

    return order;
  }

  /**
   * Approves a sales order and generates a GST-compliant tax invoice.
   */
  static async approveOrder(orderId: string, approverName: string = 'Admin'): Promise<{ order: ISalesOrder; invoice: IInvoice }> {
    const order = await SalesOrder.findById(orderId);
    if (!order) throw new Error(`Sales order ${orderId} not found`);

    if (order.status !== 'SUBMITTED') {
      throw new Error(`Order ${order.orderNumber} is already ${order.status}`);
    }

    const customer = await Customer.findById(order.customerId);
    if (!customer) throw new Error('Customer not found');

    const factoryState = 'Tamil Nadu';
    const isInterState = customer.state.trim().toLowerCase() !== factoryState.toLowerCase();

    const invoiceCount = await Invoice.countDocuments();
    const financialYear = '2024-25';
    const invoiceNumber = `INV/${financialYear}/${String(invoiceCount + 1).padStart(3, '0')}`;

    const invoiceItems: any[] = [];
    let taxableValue = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      const hsnCode = product ? product.hsnCode : '19059040';
      const itemTaxable = Math.round(item.quantity * item.unitPrice * 100) / 100;
      taxableValue += itemTaxable;

      let cgstRate = 0;
      let cgstAmount = 0;
      let sgstRate = 0;
      let sgstAmount = 0;
      let igstRate = 0;
      let igstAmount = 0;

      if (isInterState) {
        igstRate = 5;
        igstAmount = Math.round((itemTaxable * 0.05) * 100) / 100;
        igstTotal += igstAmount;
      } else {
        cgstRate = 2.5;
        cgstAmount = Math.round((itemTaxable * 0.025) * 100) / 100;
        sgstRate = 2.5;
        sgstAmount = Math.round((itemTaxable * 0.025) * 100) / 100;
        cgstTotal += cgstAmount;
        sgstTotal += sgstAmount;
      }

      const lineTotalWithTax = Math.round((itemTaxable + cgstAmount + sgstAmount + igstAmount) * 100) / 100;

      invoiceItems.push({
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        hsnCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxableAmount: itemTaxable,
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        igstRate,
        igstAmount,
        totalAmount: lineTotalWithTax
      });
    }

    const grandTotal = Math.round((taxableValue + cgstTotal + sgstTotal + igstTotal) * 100) / 100;

    const invoice = new Invoice({
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
      cgstTotal,
      sgstTotal,
      igstTotal,
      grandTotal,
      paidAmount: 0,
      balanceDue: grandTotal,
      paymentStatus: 'UNPAID',
      isDispatched: false,
      createdAt: new Date()
    });

    await invoice.save();

    // Update customer outstanding balance
    customer.outstandingBalance = Math.round((customer.outstandingBalance + grandTotal) * 100) / 100;
    await customer.save();

    order.status = 'INVOICED';
    order.invoiceId = invoice._id;
    await order.save();

    await AuditLog.create({
      action: 'ORDER_APPROVED_AND_INVOICED',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      performedBy: approverName,
      role: 'admin',
      details: {
        orderNumber: order.orderNumber,
        invoiceNumber,
        taxableValue,
        cgstTotal,
        sgstTotal,
        igstTotal,
        grandTotal
      }
    });

    return { order, invoice };
  }

  /**
   * Dispatches an invoiced order:
   * Deducts finished goods stock via StockMovement (SALES_DISPATCH)
   */
  static async dispatchOrder(invoiceId: string, dispatcherName: string = 'Admin'): Promise<IInvoice> {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);

    if (invoice.isDispatched) {
      throw new Error(`Invoice ${invoice.invoiceNumber} is already dispatched`);
    }

    for (const item of invoice.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      if (product.currentStock < item.quantity) {
        throw new Error(
          `Cannot dispatch: insufficient finished goods stock for ${product.name}. Available: ${product.currentStock}, Required: ${item.quantity}`
        );
      }

      await StockLedgerService.recordMovement({
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
        notes: `Dispatch for Invoice ${invoice.invoiceNumber} to ${invoice.customerName}`,
        createdBy: dispatcherName
      });
    }

    invoice.isDispatched = true;
    invoice.dispatchDate = new Date();
    await invoice.save();

    await SalesOrder.findByIdAndUpdate(invoice.salesOrderId, { status: 'DISPATCHED' });

    await AuditLog.create({
      action: 'ORDER_DISPATCHED',
      entityType: 'Invoice',
      entityId: invoice._id.toString(),
      performedBy: dispatcherName,
      role: 'admin',
      details: {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        itemsCount: invoice.items.length
      }
    });

    return invoice;
  }

  /**
   * Records a payment against an invoice and recalculates customer outstanding balance
   */
  static async recordPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    receivedBy?: string;
  }): Promise<{ payment: IPayment; invoice: IInvoice; customer: any }> {
    const invoice = await Invoice.findById(params.invoiceId);
    if (!invoice) throw new Error(`Invoice ${params.invoiceId} not found`);

    const customer = await Customer.findById(invoice.customerId);
    if (!customer) throw new Error('Customer not found');

    const count = await Payment.countDocuments();
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    const payment = new Payment({
      paymentNumber,
      customerId: customer._id,
      customerCode: customer.code,
      customerName: customer.name,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      amount: params.amount,
      paymentMethod: params.paymentMethod || 'BANK_TRANSFER',
      reference: params.reference,
      notes: params.notes,
      date: new Date()
    });

    await payment.save();

    // Update Invoice balances
    invoice.paidAmount = Math.round((invoice.paidAmount + params.amount) * 100) / 100;
    invoice.balanceDue = Math.round((invoice.grandTotal - invoice.paidAmount) * 100) / 100;
    if (invoice.balanceDue <= 0) {
      invoice.balanceDue = 0;
      invoice.paymentStatus = 'PAID';
    } else {
      invoice.paymentStatus = 'PARTIALLY_PAID';
    }
    await invoice.save();

    // Update Customer outstanding balance
    customer.outstandingBalance = Math.round((customer.outstandingBalance - params.amount) * 100) / 100;
    if (customer.outstandingBalance < 0) customer.outstandingBalance = 0;
    await customer.save();

    await AuditLog.create({
      action: 'PAYMENT_RECORDED',
      entityType: 'Payment',
      entityId: payment._id.toString(),
      performedBy: params.receivedBy || 'ACCOUNTANT',
      role: 'accountant',
      details: {
        paymentNumber,
        invoiceNumber: invoice.invoiceNumber,
        customerName: customer.name,
        amount: params.amount,
        remainingInvoiceBalance: invoice.balanceDue,
        remainingCustomerOutstanding: customer.outstandingBalance
      }
    });

    return { payment, invoice, customer };
  }
}
