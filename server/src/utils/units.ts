/**
 * ZenLyft Multi-Unit Conversion Engine
 * 
 * Supports standard Food Manufacturing conversions:
 * - Weight: kg <-> g (Base: kg)
 * - Volume: litre <-> ml (Base: litre)
 * - Count / Packaging: piece <-> packet <-> carton (Base: packet/piece, carton = N packets)
 * 
 * Throws on incompatible dimensional conversions (e.g. kg -> litre).
 */

export type UnitDimension = 'weight' | 'volume' | 'count';

interface UnitDef {
  baseUnit: string;
  factorToBase: number;
  dimension: UnitDimension;
}

const UNIT_REGISTRY: Record<string, UnitDef> = {
  // Weight dimension (Base: kg)
  kg: { baseUnit: 'kg', factorToBase: 1, dimension: 'weight' },
  kilogram: { baseUnit: 'kg', factorToBase: 1, dimension: 'weight' },
  kilograms: { baseUnit: 'kg', factorToBase: 1, dimension: 'weight' },
  g: { baseUnit: 'kg', factorToBase: 0.001, dimension: 'weight' },
  gram: { baseUnit: 'kg', factorToBase: 0.001, dimension: 'weight' },
  grams: { baseUnit: 'kg', factorToBase: 0.001, dimension: 'weight' },

  // Volume dimension (Base: litre)
  litre: { baseUnit: 'litre', factorToBase: 1, dimension: 'volume' },
  litres: { baseUnit: 'litre', factorToBase: 1, dimension: 'volume' },
  liter: { baseUnit: 'litre', factorToBase: 1, dimension: 'volume' },
  liters: { baseUnit: 'litre', factorToBase: 1, dimension: 'volume' },
  l: { baseUnit: 'litre', factorToBase: 1, dimension: 'volume' },
  ml: { baseUnit: 'litre', factorToBase: 0.001, dimension: 'volume' },
  millilitre: { baseUnit: 'litre', factorToBase: 0.001, dimension: 'volume' },
  millilitres: { baseUnit: 'litre', factorToBase: 0.001, dimension: 'volume' },
  milliliter: { baseUnit: 'litre', factorToBase: 0.001, dimension: 'volume' },
  milliliters: { baseUnit: 'litre', factorToBase: 0.001, dimension: 'volume' },

  // Count / Packaging dimension (Base: packet / piece)
  piece: { baseUnit: 'piece', factorToBase: 1, dimension: 'count' },
  pieces: { baseUnit: 'piece', factorToBase: 1, dimension: 'count' },
  pcs: { baseUnit: 'piece', factorToBase: 1, dimension: 'count' },
  packet: { baseUnit: 'packet', factorToBase: 1, dimension: 'count' },
  packets: { baseUnit: 'packet', factorToBase: 1, dimension: 'count' },
  pkt: { baseUnit: 'packet', factorToBase: 1, dimension: 'count' },
  pkts: { baseUnit: 'packet', factorToBase: 1, dimension: 'count' },
  carton: { baseUnit: 'carton', factorToBase: 1, dimension: 'count' },
  cartons: { baseUnit: 'carton', factorToBase: 1, dimension: 'count' },
  box: { baseUnit: 'carton', factorToBase: 1, dimension: 'count' },
  boxes: { baseUnit: 'carton', factorToBase: 1, dimension: 'count' }
};

export interface ConversionOptions {
  packetsPerCarton?: number;
}

export function normalizeUnit(rawUnit: string): string {
  if (!rawUnit) return 'piece';
  const clean = rawUnit.trim().toLowerCase();
  return UNIT_REGISTRY[clean]?.baseUnit || clean;
}

export function getUnitDimension(rawUnit: string): UnitDimension {
  const clean = rawUnit.trim().toLowerCase();
  const def = UNIT_REGISTRY[clean];
  if (!def) {
    throw new Error(`Unrecognized measurement unit: '${rawUnit}'`);
  }
  return def.dimension;
}

export function isCompatibleUnit(unitA: string, unitB: string): boolean {
  try {
    return getUnitDimension(unitA) === getUnitDimension(unitB);
  } catch {
    return false;
  }
}

/**
 * Converts a quantity from one unit to another.
 * Throws an Error if units are dimensionally incompatible (e.g. kg -> litre).
 * 
 * @param qty Number of units
 * @param fromUnit Source unit (e.g. 'g', 'ml', 'carton')
 * @param toUnit Target unit (e.g. 'kg', 'litre', 'packet')
 * @param options Optional context like packetsPerCarton (default: 20)
 */
export function convert(
  qty: number,
  fromUnit: string,
  toUnit: string,
  options?: ConversionOptions
): number {
  const fromClean = fromUnit.trim().toLowerCase();
  const toClean = toUnit.trim().toLowerCase();

  if (fromClean === toClean) {
    return qty;
  }

  const fromDef = UNIT_REGISTRY[fromClean];
  const toDef = UNIT_REGISTRY[toClean];

  if (!fromDef) throw new Error(`Unknown source unit: '${fromUnit}'`);
  if (!toDef) throw new Error(`Unknown target unit: '${toUnit}'`);

  if (fromDef.dimension !== toDef.dimension) {
    throw new Error(
      `Cannot convert incompatible units: cannot convert '${fromUnit}' (${fromDef.dimension}) to '${toUnit}' (${toDef.dimension}).`
    );
  }

  const packetsPerCarton = options?.packetsPerCarton || 20;

  // Discrete carton <-> packet conversions
  if (
    (fromDef.baseUnit === 'carton' && toDef.baseUnit === 'packet') ||
    (fromDef.baseUnit === 'carton' && toDef.baseUnit === 'piece')
  ) {
    return Math.round(qty * packetsPerCarton * 1000) / 1000;
  }

  if (
    (fromDef.baseUnit === 'packet' && toDef.baseUnit === 'carton') ||
    (fromDef.baseUnit === 'piece' && toDef.baseUnit === 'carton')
  ) {
    return Math.round((qty / packetsPerCarton) * 1000) / 1000;
  }

  // Standard metric factor conversion
  const baseValue = qty * fromDef.factorToBase;
  const result = baseValue / toDef.factorToBase;
  return Math.round(result * 1000) / 1000;
}
