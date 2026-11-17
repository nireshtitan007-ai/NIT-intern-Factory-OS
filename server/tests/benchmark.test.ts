import { connectDB, disconnectDB } from '../src/config/db';
import { executeBenchmarkScenario } from '../src/scripts/runBenchmark';

jest.setTimeout(180000);

describe('NIT Tiruchirappalli Order-to-Audit Benchmark Acceptance Suite', () => {
  beforeAll(async () => {
    await connectDB();
  }, 180000);

  afterAll(async () => {
    await disconnectDB();
  });

  it('should execute Section 5 Benchmark end-to-end and pass 100% of audit checks', async () => {
    const result = await executeBenchmarkScenario();
    expect(result.allPassed).toBe(true);
    for (const check of result.checks) {
      expect(check.pass).toBe(true);
    }
  });
});
