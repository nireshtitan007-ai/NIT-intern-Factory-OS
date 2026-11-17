export type UserRole = 'salesman' | 'admin' | 'production' | 'accountant' | 'owner' | 'whatsapp';

export interface Customer {
  _id: string;
  code: string;
  name: string;
  type: 'RETAILER' | 'DISTRIBUTOR';
  state: string;
  stateCode: string;
  gstin?: string;
  address: string;
  city: string;
  phone: string;
  creditLimit: number;
  outstandingBalance: number;
}

export interface Product {
  _id: string;
  code: string;
  name: string;
  packSize: string;
  unit: string;
  sellingPrice: number;
  gstRate: number;
  hsnCode: string;
  currentStock: number;
  openingStock: number;
}

export interface RawMaterial {
  _id: string;
  code: string;
  name: string;
  category: 'RAW_MATERIAL' | 'PACKAGING';
  unit: string;
  openingStock: number;
  currentStock: number;
  standardRate: number;
  currentWeightedRate: number;
  reorderLevel: number;
}

export interface SalesOrder {
  _id: string;
  orderNumber: string;
  salesmanName: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerState: string;
  items: Array<{
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  status: 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'INVOICED' | 'DISPATCHED';
  stockCheck: {
    availableStock: number;
    isSufficient: boolean;
    shortageQuantity: number;
  };
  invoiceId?: string;
  createdAt: string;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  salesOrderId: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerGstin?: string;
  customerState: string;
  placeOfSupply: string;
  isInterState: boolean;
  items: Array<{
    productId: string;
    productName: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    totalAmount: number;
  }>;
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  isDispatched: boolean;
  createdAt: string;
}

export interface StockSummaryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  receipts: number;
  issuesOrSales: number;
  closingStock: number;
  ledgerBalance: number;
  rate: number;
  stockValue: number;
}

export interface StockMovement {
  _id: string;
  itemType: string;
  itemCode: string;
  itemName: string;
  movementType: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  sourceDocType: string;
  sourceDocId?: string;
  runningBalance: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ProductionRun {
  _id: string;
  runNumber: string;
  productName: string;
  batchExpectedOutput: number;
  actualOutputPackets: number;
  damagedPouches: number;
  cartonsUsed: number;
  yieldPercent: number;
  yieldVariancePercent: number;
  yieldVarianceFlagged: boolean;
  materialsIssued: Array<{
    materialCode: string;
    materialName: string;
    standardQty: number;
    actualQtyIssued: number;
    unit: string;
    variancePercent: number;
    varianceFlagged: boolean;
    totalCost: number;
  }>;
  directLaborCost: number;
  directOverheadCost: number;
  totalMaterialCost: number;
  totalProductionCost: number;
  costPerPacket: number;
  createdAt: string;
}

