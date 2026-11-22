import { z } from 'zod';

export const createCustomerSchema = z.object({
  code: z.string().min(1, 'Customer code is required').trim(),
  name: z.string().min(1, 'Customer name is required').trim(),
  type: z.enum(['RETAILER', 'DISTRIBUTOR']),
  state: z.string().min(1, 'State is required'),
  stateCode: z.string().min(1, 'State code is required'),
  gstin: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  creditLimit: z.number().nonnegative().optional(),
  assignedSalesmanId: z.string().optional(),
  priceList: z.array(z.object({
    productCode: z.string().min(1),
    unitPrice: z.number().positive('Unit price must be positive')
  })).optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createProductSchema = z.object({
  code: z.string().min(1, 'Product code is required').trim(),
  name: z.string().min(1, 'Product name is required').trim(),
  packSize: z.string().min(1, 'Pack size is required'),
  unit: z.string().default('packet'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  gstRate: z.number().nonnegative().default(5),
  hsnCode: z.string().default('19059040'),
  packetsPerCarton: z.number().int().positive().default(20),
  shelfLifeDays: z.number().int().positive().default(90)
});

export const updateProductSchema = createProductSchema.partial();

export const createRawMaterialSchema = z.object({
  code: z.string().min(1, 'Material code is required').trim(),
  name: z.string().min(1, 'Material name is required').trim(),
  category: z.enum(['RAW_MATERIAL', 'PACKAGING']),
  unit: z.string().min(1, 'Unit is required'),
  standardRate: z.number().nonnegative('Standard rate cannot be negative'),
  reorderLevel: z.number().nonnegative().default(0)
});

export const updateRawMaterialSchema = createRawMaterialSchema.partial();

export const createBOMSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  batchExpectedOutput: z.number().positive('Batch expected output must be positive'),
  outputUnit: z.string().default('packets'),
  tolerancePercent: z.number().nonnegative().default(3),
  rawMaterials: z.array(z.object({
    materialId: z.string().min(1),
    quantityPerBatch: z.number().positive(),
    unit: z.string(),
    standardRate: z.number().nonnegative(),
    consumptionBasis: z.enum(['PER_BATCH', 'PER_GOOD_PACKET_PLUS_SCRAP', 'PER_N_PACKETS']).optional(),
    packetsPerUnit: z.number().positive().optional()
  })),
  packagingMaterials: z.array(z.object({
    materialId: z.string().min(1),
    quantityPerBatch: z.number().positive(),
    unit: z.string(),
    standardRate: z.number().nonnegative(),
    consumptionBasis: z.enum(['PER_BATCH', 'PER_GOOD_PACKET_PLUS_SCRAP', 'PER_N_PACKETS']).optional(),
    packetsPerUnit: z.number().positive().optional()
  }))
});

export const updateBOMSchema = createBOMSchema.partial();

export const createSupplierSchema = z.object({
  code: z.string().min(1, 'Supplier code is required').trim(),
  name: z.string().min(1, 'Supplier name is required').trim(),
  gstin: z.string().optional(),
  state: z.string().min(1, 'State is required'),
  stateCode: z.string().min(1, 'State code is required'),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  paymentTermsDays: z.number().int().nonnegative().default(30)
});

export const updateSupplierSchema = createSupplierSchema.partial();
