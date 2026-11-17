import { Notification, INotification, NotificationTemplateType } from '../models';

export interface SendWhatsAppParams {
  recipientPhone: string;
  recipientName: string;
  templateType: NotificationTemplateType;
  variables: Record<string, string | number>;
  sourceDocType?: string;
  sourceDocId?: string;
}

export class WhatsAppService {
  private static openWaServerUrl = process.env.OPENWA_SERVER_URL || 'http://localhost:8080';

  /**
   * Resolves template strings with business variables
   */
  static renderTemplate(templateType: NotificationTemplateType, vars: Record<string, any>): string {
    switch (templateType) {
      case 'ORDER_CONFIRMATION':
        return `*NASH FOODS FACTORY - ORDER CONFIRMATION*\n\nDear ${vars.customerName},\nYour sales order *${vars.orderNumber}* has been received.\n\n*Product:* ${vars.productName}\n*Quantity:* ${vars.quantity} pkts\n*Taxable Amount:* ₹${vars.totalAmount}\n\nOur admin team is verifying stock coverage for dispatch. Thank you for your business!`;

      case 'INVOICE_DELIVERY':
        return `*NASH FOODS FACTORY - GST TAX INVOICE*\n\nDear ${vars.customerName},\nTax Invoice *${vars.invoiceNumber}* has been raised.\n\n*Taxable Value:* ₹${vars.taxableValue}\n*CGST:* ₹${vars.cgstTotal} | *SGST:* ₹${vars.sgstTotal} | *IGST:* ₹${vars.igstTotal}\n*Grand Total:* ₹${vars.grandTotal}\n*Place of Supply:* ${vars.placeOfSupply}\n\nInvoice PDF: ${vars.pdfUrl || 'Available on customer portal'}\nPayment Due Date: 30 days from invoice date.`;

      case 'DISPATCH_ALERT':
        return `*NASH FOODS - DISPATCH NOTIFICATION*\n\nDear ${vars.customerName},\nYour shipment for Invoice *${vars.invoiceNumber}* has been dispatched from our Tiruchirappalli factory floor.\n\n*Items Dispatched:* ${vars.itemSummary || 'Packaged Snacks'}\nOur logistics team will coordinate delivery.`;

      case 'PAYMENT_RECEIPT':
        return `*NASH FOODS - PAYMENT ACKNOWLEDGMENT*\n\nDear ${vars.customerName},\nWe acknowledge receipt of *₹${vars.amount}* against Invoice *${vars.invoiceNumber}*.\n*Payment Mode:* ${vars.paymentMethod || 'Bank Transfer'}\n*Remaining Balance Due:* ₹${vars.balanceDue}\n*Total Outstanding:* ₹${vars.customerOutstanding}\n\nThank you for prompt clearance!`;

      case 'LOW_STOCK_ALERT':
        return `*INTERNAL ALERT: LOW STOCK DETECTED*\n\n*Material:* ${vars.materialName} (${vars.materialCode})\n*Current Balance:* ${vars.currentStock} ${vars.unit}\n*Reorder Threshold:* ${vars.reorderLevel} ${vars.unit}\nPlease initiate supplier procurement requisition immediately.`;

      case 'PRODUCTION_VARIANCE_ALERT':
        return `*INTERNAL ALERT: PRODUCTION VARIANCE EXCEEDED*\n\n*Run No:* ${vars.runNumber}\n*Product:* ${vars.productName}\n*Actual Yield:* ${vars.actualOutput} pkts (${vars.yieldPercent}%)\n*Yield Variance:* ${vars.yieldVariancePercent}% (Beyond ±3% threshold)\n*Damaged Pouches:* ${vars.damagedPouches} pcs\nPlease review floor operations.`;

      default:
        return `*NASH FOODS UPDATE*\nHello ${vars.customerName || 'Customer'}, you have a new update from Nash Foods factory.`;
    }
  }

  /**
   * Dispatches WhatsApp message via OpenWA service adapter with fallback logging
   */
  static async sendNotification(params: SendWhatsAppParams): Promise<INotification> {
    const messageBody = this.renderTemplate(params.templateType, params.variables);

    // Format Indian phone number standard (e.g. 919876543210@c.us)
    const cleanPhone = params.recipientPhone.replace(/[^0-9]/g, '');
    const chatId = cleanPhone.startsWith('91') ? `${cleanPhone}@c.us` : `91${cleanPhone}@c.us`;

    let deliveryStatus = 'QUEUED';
    let errorMessage: string | undefined;

    try {
      // Attempt sending to OpenWA REST API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

      const response = await fetch(`${this.openWaServerUrl}/sendText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          text: messageBody
        }),
        signal: controller.signal
      }).catch(err => {
        // OpenWA server offline or running in mock standalone mode
        return null;
      });

      clearTimeout(timeoutId);

      if (response && response.ok) {
        deliveryStatus = 'DELIVERED_VIA_OPENWA';
      } else {
        deliveryStatus = 'SIMULATED_OPENWA_DELIVERY';
      }
    } catch (err: any) {
      errorMessage = err.message;
      deliveryStatus = 'SIMULATED_OPENWA_DELIVERY';
    }

    const notification = new Notification({
      recipientPhone: params.recipientPhone,
      recipientName: params.recipientName,
      templateType: params.templateType,
      messageBody,
      status: 'SENT',
      provider: 'OPENWA',
      sourceDocType: params.sourceDocType,
      sourceDocId: params.sourceDocId,
      deliveryStatus,
      sentAt: new Date(),
      error: errorMessage
    });

    await notification.save();
    return notification;
  }

  /**
   * Automatically triggered hooks when business transactions occur
   */
  static async onOrderApproved(order: any, customer: any) {
    return this.sendNotification({
      recipientPhone: customer.phone || '9876543210',
      recipientName: customer.name,
      templateType: 'ORDER_CONFIRMATION',
      variables: {
        customerName: customer.name,
        orderNumber: order.orderNumber,
        productName: order.items[0]?.productName || 'Murukku 200 g',
        quantity: order.items[0]?.quantity || 150,
        totalAmount: order.totalAmount
      },
      sourceDocType: 'SALES_ORDER',
      sourceDocId: order.orderNumber
    });
  }

  static async onInvoiceRaised(invoice: any) {
    return this.sendNotification({
      recipientPhone: '9876543210',
      recipientName: invoice.customerName,
      templateType: 'INVOICE_DELIVERY',
      variables: {
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        taxableValue: invoice.taxableValue.toFixed(2),
        cgstTotal: invoice.cgstTotal.toFixed(2),
        sgstTotal: invoice.sgstTotal.toFixed(2),
        igstTotal: invoice.igstTotal.toFixed(2),
        grandTotal: invoice.grandTotal.toFixed(2),
        placeOfSupply: invoice.placeOfSupply
      },
      sourceDocType: 'INVOICE',
      sourceDocId: invoice.invoiceNumber
    });
  }

  static async onDispatch(invoice: any) {
    return this.sendNotification({
      recipientPhone: '9876543210',
      recipientName: invoice.customerName,
      templateType: 'DISPATCH_ALERT',
      variables: {
        customerName: invoice.customerName,
        invoiceNumber: invoice.invoiceNumber,
        itemSummary: invoice.items.map((i: any) => `${i.quantity} pkts ${i.productName}`).join(', ')
      },
      sourceDocType: 'DISPATCH',
      sourceDocId: invoice.invoiceNumber
    });
  }

  static async onPaymentReceived(payment: any, invoice: any, customer: any) {
    return this.sendNotification({
      recipientPhone: customer.phone || '9876543210',
      recipientName: customer.name,
      templateType: 'PAYMENT_RECEIPT',
      variables: {
        customerName: customer.name,
        invoiceNumber: invoice.invoiceNumber,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        balanceDue: invoice.balanceDue.toFixed(2),
        customerOutstanding: customer.outstandingBalance.toFixed(2)
      },
      sourceDocType: 'PAYMENT',
      sourceDocId: payment.paymentNumber
    });
  }

  static async onProductionVariance(run: any) {
    if (run.yieldVarianceFlagged) {
      return this.sendNotification({
        recipientPhone: '+91 94433 12345',
        recipientName: 'Floor Supervisor & Plant Manager',
        templateType: 'PRODUCTION_VARIANCE_ALERT',
        variables: {
          runNumber: run.runNumber,
          productName: run.productName,
          actualOutput: run.actualOutputPackets,
          yieldPercent: run.yieldPercent,
          yieldVariancePercent: run.yieldVariancePercent,
          damagedPouches: run.damagedPouches
        },
        sourceDocType: 'PRODUCTION_RUN',
        sourceDocId: run.runNumber
      });
    }
  }

  static async getNotifications() {
    return Notification.find().sort({ createdAt: -1 }).limit(100).lean();
  }
}
