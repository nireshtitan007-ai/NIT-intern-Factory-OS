import { paiseToRupees, formatINR } from './money';

export class Serializers {
  static serializeProduct(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const sellingPricePaise = obj.sellingPricePaise ?? Math.round((obj.sellingPrice || 0) * 100);
    return {
      ...obj,
      sellingPricePaise,
      sellingPrice: paiseToRupees(sellingPricePaise),
      sellingPriceFormatted: formatINR(sellingPricePaise)
    };
  }

  static serializeRawMaterial(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const standardRatePaise = obj.standardRatePaise ?? Math.round((obj.standardRate || 0) * 100);
    const currentWeightedRatePaise = obj.currentWeightedRatePaise ?? Math.round((obj.currentWeightedRate || 0) * 100);
    const totalValuePaise = obj.totalValuePaise ?? Math.round((obj.currentStock || 0) * currentWeightedRatePaise);

    return {
      ...obj,
      standardRatePaise,
      standardRate: paiseToRupees(standardRatePaise),
      currentWeightedRatePaise,
      currentWeightedRate: paiseToRupees(currentWeightedRatePaise),
      totalValuePaise,
      totalValue: paiseToRupees(totalValuePaise)
    };
  }

  static serializeSalesOrder(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const totalAmountPaise = obj.totalAmountPaise ?? Math.round((obj.totalAmount || 0) * 100);
    const items = (obj.items || []).map((i: any) => {
      const unitPricePaise = i.unitPricePaise ?? Math.round((i.unitPrice || 0) * 100);
      const lineTotalPaise = i.lineTotalPaise ?? Math.round((i.lineTotal || 0) * 100);
      return {
        ...i,
        unitPricePaise,
        unitPrice: paiseToRupees(unitPricePaise),
        lineTotalPaise,
        lineTotal: paiseToRupees(lineTotalPaise)
      };
    });

    return {
      ...obj,
      items,
      totalAmountPaise,
      totalAmount: paiseToRupees(totalAmountPaise)
    };
  }

  static serializeInvoice(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const taxableValuePaise = obj.taxableValuePaise ?? Math.round((obj.taxableValue || 0) * 100);
    const cgstTotalPaise = obj.cgstTotalPaise ?? Math.round((obj.cgstTotal || 0) * 100);
    const sgstTotalPaise = obj.sgstTotalPaise ?? Math.round((obj.sgstTotal || 0) * 100);
    const igstTotalPaise = obj.igstTotalPaise ?? Math.round((obj.igstTotal || 0) * 100);
    const grandTotalPaise = obj.grandTotalPaise ?? Math.round((obj.grandTotal || 0) * 100);
    const paidAmountPaise = obj.paidAmountPaise ?? Math.round((obj.paidAmount || 0) * 100);
    const balanceDuePaise = obj.balanceDuePaise ?? Math.round((obj.balanceDue || 0) * 100);

    const items = (obj.items || []).map((i: any) => {
      const unitPricePaise = i.unitPricePaise ?? Math.round((i.unitPrice || 0) * 100);
      const taxableAmountPaise = i.taxableAmountPaise ?? Math.round((i.taxableAmount || 0) * 100);
      const cgstAmountPaise = i.cgstAmountPaise ?? Math.round((i.cgstAmount || 0) * 100);
      const sgstAmountPaise = i.sgstAmountPaise ?? Math.round((i.sgstAmount || 0) * 100);
      const igstAmountPaise = i.igstAmountPaise ?? Math.round((i.igstAmount || 0) * 100);
      const totalAmountPaise = i.totalAmountPaise ?? Math.round((i.totalAmount || 0) * 100);

      return {
        ...i,
        unitPricePaise,
        unitPrice: paiseToRupees(unitPricePaise),
        taxableAmountPaise,
        taxableAmount: paiseToRupees(taxableAmountPaise),
        cgstAmountPaise,
        cgstAmount: paiseToRupees(cgstAmountPaise),
        sgstAmountPaise,
        sgstAmount: paiseToRupees(sgstAmountPaise),
        igstAmountPaise,
        igstAmount: paiseToRupees(igstAmountPaise),
        totalAmountPaise,
        totalAmount: paiseToRupees(totalAmountPaise)
      };
    });

    return {
      ...obj,
      items,
      taxableValuePaise,
      taxableValue: paiseToRupees(taxableValuePaise),
      cgstTotalPaise,
      cgstTotal: paiseToRupees(cgstTotalPaise),
      sgstTotalPaise,
      sgstTotal: paiseToRupees(sgstTotalPaise),
      igstTotalPaise,
      igstTotal: paiseToRupees(igstTotalPaise),
      grandTotalPaise,
      grandTotal: paiseToRupees(grandTotalPaise),
      paidAmountPaise,
      paidAmount: paiseToRupees(paidAmountPaise),
      balanceDuePaise,
      balanceDue: paiseToRupees(balanceDuePaise)
    };
  }

  static serializePayment(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const amountPaise = obj.amountPaise ?? Math.round((obj.amount || 0) * 100);
    return {
      ...obj,
      amountPaise,
      amount: paiseToRupees(amountPaise)
    };
  }

  static serializeCustomer(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const outstandingBalancePaise = obj.outstandingBalancePaise ?? Math.round((obj.outstandingBalance || 0) * 100);
    const creditLimitPaise = obj.creditLimitPaise ?? Math.round((obj.creditLimit || 0) * 100);
    return {
      ...obj,
      outstandingBalancePaise,
      outstandingBalance: paiseToRupees(outstandingBalancePaise),
      creditLimitPaise,
      creditLimit: paiseToRupees(creditLimitPaise)
    };
  }

  static serializeProductionRun(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const directLaborCostPaise = obj.directLaborCostPaise ?? Math.round((obj.directLaborCost || 0) * 100);
    const directOverheadCostPaise = obj.directOverheadCostPaise ?? Math.round((obj.directOverheadCost || 0) * 100);
    const totalMaterialCostPaise = obj.totalMaterialCostPaise ?? Math.round((obj.totalMaterialCost || 0) * 100);
    const totalProductionCostPaise = obj.totalProductionCostPaise ?? Math.round((obj.totalProductionCost || 0) * 100);
    const costPerPacketPaise = obj.costPerPacketPaise ?? Math.round((obj.costPerPacket || 0) * 100);

    const materialsIssued = (obj.materialsIssued || []).map((m: any) => {
      const unitCostPaise = m.unitCostPaise ?? Math.round((m.unitCost || 0) * 100);
      const totalCostPaise = m.totalCostPaise ?? Math.round((m.totalCost || 0) * 100);
      return {
        ...m,
        unitCostPaise,
        unitCost: paiseToRupees(unitCostPaise),
        totalCostPaise,
        totalCost: paiseToRupees(totalCostPaise)
      };
    });

    return {
      ...obj,
      materialsIssued,
      directLaborCostPaise,
      directLaborCost: paiseToRupees(directLaborCostPaise),
      directOverheadCostPaise,
      directOverheadCost: paiseToRupees(directOverheadCostPaise),
      totalMaterialCostPaise,
      totalMaterialCost: paiseToRupees(totalMaterialCostPaise),
      totalProductionCostPaise,
      totalProductionCost: paiseToRupees(totalProductionCostPaise),
      costPerPacketPaise,
      costPerPacket: paiseToRupees(costPerPacketPaise)
    };
  }

  static serializeStockMovement(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const unitCostPaise = obj.unitCostPaise ?? Math.round((obj.unitCost || 0) * 100);
    const totalCostPaise = obj.totalCostPaise ?? Math.round((obj.totalCost || 0) * 100);
    return {
      ...obj,
      unitCostPaise,
      unitCost: paiseToRupees(unitCostPaise),
      totalCostPaise,
      totalCost: paiseToRupees(totalCostPaise)
    };
  }

  static serializePurchase(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const totalAmountPaise = obj.totalAmountPaise ?? Math.round((obj.totalAmount || 0) * 100);
    const items = (obj.items || []).map((i: any) => {
      const ratePaise = i.ratePaise ?? Math.round((i.rate || 0) * 100);
      const totalPaise = i.totalPaise ?? Math.round((i.total || 0) * 100);
      return {
        ...i,
        ratePaise,
        rate: paiseToRupees(ratePaise),
        totalPaise,
        total: paiseToRupees(totalPaise)
      };
    });
    return {
      ...obj,
      items,
      totalAmountPaise,
      totalAmount: paiseToRupees(totalAmountPaise)
    };
  }

  static serializeCreditNote(doc: any) {
    if (!doc) return null;
    const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc };
    const taxableValuePaise = obj.taxableValuePaise ?? Math.round((obj.taxableValue || 0) * 100);
    const cgstTotalPaise = obj.cgstTotalPaise ?? Math.round((obj.cgstTotal || 0) * 100);
    const sgstTotalPaise = obj.sgstTotalPaise ?? Math.round((obj.sgstTotal || 0) * 100);
    const igstTotalPaise = obj.igstTotalPaise ?? Math.round((obj.igstTotal || 0) * 100);
    const grandTotalPaise = obj.grandTotalPaise ?? Math.round((obj.grandTotal || 0) * 100);
    return {
      ...obj,
      taxableValuePaise,
      taxableValue: paiseToRupees(taxableValuePaise),
      cgstTotalPaise,
      cgstTotal: paiseToRupees(cgstTotalPaise),
      sgstTotalPaise,
      sgstTotal: paiseToRupees(sgstTotalPaise),
      igstTotalPaise,
      igstTotal: paiseToRupees(igstTotalPaise),
      grandTotalPaise,
      grandTotal: paiseToRupees(grandTotalPaise)
    };
  }
}
