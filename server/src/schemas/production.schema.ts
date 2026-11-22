import { z } from 'zod';

export const executeProductionRunSchema = z.object({
  productId: z.string().optional(),
  productCode: z.string().optional(),
  materialIssues: z.array(z.object({
    materialCode: z.string(),
    actualQtyIssued: z.number().nonnegative()
  })).optional(),
  actualOutputPackets: z.number().int().nonnegative().optional(),
  goodOutputPackets: z.number().int().nonnegative().optional(),
  actualFlour: z.number().nonnegative().optional(),
  actualOil: z.number().nonnegative().optional(),
  actualSpice: z.number().nonnegative().optional(),
  damagedPouches: z.number().int().nonnegative().optional().default(0),
  cartonsUsed: z.number().int().nonnegative().optional().default(0),
  directLaborCost: z.number().nonnegative().optional().default(0),
  directOverheadCost: z.number().nonnegative().optional().default(0),
  supervisorName: z.string().optional(),
  notes: z.string().optional()
});

export const updateOverheadsSchema = z.object({
  laborCost: z.number().nonnegative().optional(),
  overheadCost: z.number().nonnegative().optional(),
  directLaborCost: z.number().nonnegative().optional(),
  directOverheadCost: z.number().nonnegative().optional()
});
