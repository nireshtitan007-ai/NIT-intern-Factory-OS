import { convert, isCompatibleUnit, normalizeUnit } from '../src/utils/units';

describe('ZenLyft Unit Conversion Engine', () => {
  describe('Metric Weight & Volume Conversions', () => {
    it('converts 40000 g to 40 kg accurately', () => {
      expect(convert(40000, 'g', 'kg')).toBe(40);
      expect(convert(40, 'kg', 'g')).toBe(40000);
      expect(convert(1200, 'grams', 'kg')).toBe(1.2);
    });

    it('converts 10500 ml to 10.5 L accurately', () => {
      expect(convert(10500, 'ml', 'litre')).toBe(10.5);
      expect(convert(10.5, 'litre', 'ml')).toBe(10500);
      expect(convert(500, 'millilitres', 'l')).toBe(0.5);
    });

    it('throws error when attempting to convert dimensionally incompatible units (kg -> litre)', () => {
      expect(() => convert(10, 'kg', 'litre')).toThrow('Cannot convert incompatible units');
      expect(() => convert(5, 'l', 'g')).toThrow('Cannot convert incompatible units');
      expect(isCompatibleUnit('kg', 'litre')).toBe(false);
      expect(isCompatibleUnit('kg', 'g')).toBe(true);
      expect(isCompatibleUnit('l', 'ml')).toBe(true);
    });
  });

  describe('Packaging & Discrete Unit Conversions', () => {
    it('converts 5 cartons to 100 packets with default 20 pkts/carton', () => {
      expect(convert(5, 'carton', 'packet')).toBe(100);
      expect(convert(100, 'packet', 'carton')).toBe(5);
    });

    it('supports configurable packetsPerCarton for different SKUs', () => {
      // 500g SKU with 10 packets per carton
      expect(convert(4, 'carton', 'packet', { packetsPerCarton: 10 })).toBe(40);
      expect(convert(40, 'packet', 'carton', { packetsPerCarton: 10 })).toBe(4);
    });

    it('normalizes unit variations cleanly', () => {
      expect(normalizeUnit('KG')).toBe('kg');
      expect(normalizeUnit('Grams')).toBe('kg');
      expect(normalizeUnit('Litres')).toBe('litre');
      expect(normalizeUnit('pkts')).toBe('packet');
    });
  });
});
