import fs from 'fs';
import path from 'path';

describe('Step 3: Tamil / English Bilingual Interface Completeness Suite', () => {
  const enPath = path.resolve(__dirname, '../../client/src/i18n/en.json');
  const taPath = path.resolve(__dirname, '../../client/src/i18n/ta.json');

  let enDict: Record<string, string>;
  let taDict: Record<string, string>;

  beforeAll(() => {
    expect(fs.existsSync(enPath)).toBe(true);
    expect(fs.existsSync(taPath)).toBe(true);
    enDict = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    taDict = JSON.parse(fs.readFileSync(taPath, 'utf8'));
  });

  it('guarantees that every key in en.json exists in ta.json with non-empty translation', () => {
    const enKeys = Object.keys(enDict);
    expect(enKeys.length).toBeGreaterThan(0);

    for (const key of enKeys) {
      expect(key in taDict).toBe(true);
      expect(typeof taDict[key]).toBe('string');
      expect(taDict[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('guarantees that every key in ta.json exists in en.json with non-empty English text', () => {
    const taKeys = Object.keys(taDict);
    expect(taKeys.length).toBeGreaterThan(0);

    for (const key of taKeys) {
      expect(key in enDict).toBe(true);
      expect(typeof enDict[key]).toBe('string');
      expect(enDict[key].trim().length).toBeGreaterThan(0);
    }
  });

  it('validates critical floor staff vocabulary in Tamil translation', () => {
    // Verify core floor terminology translates accurately to colloquial Tamil factory terms
    expect(taDict['production.flour']).toContain('மாவு');
    expect(taDict['production.cookingOil']).toContain('எண்ணெய்');
    expect(taDict['production.costPerPacket']).toContain('ஒரு பாக்கெட் செலவு');
    expect(taDict['production.damagedPouches']).toContain('சேதமடைந்த');
    expect(taDict['production.yield']).toContain('விளைச்சல்');
    expect(taDict['production.withinTolerance']).toContain('வரம்பிற்குள்');
  });
});
