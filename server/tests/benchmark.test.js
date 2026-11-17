"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../src/config/db");
const runBenchmark_1 = require("../src/scripts/runBenchmark");
describe('NIT Tiruchirappalli Order-to-Audit Benchmark Acceptance Suite', () => {
    beforeAll(async () => {
        await (0, db_1.connectDB)();
    });
    afterAll(async () => {
        await (0, db_1.disconnectDB)();
    });
    it('should execute Section 5 Benchmark end-to-end and pass 100% of audit checks', async () => {
        const result = await (0, runBenchmark_1.executeBenchmarkScenario)();
        expect(result.allPassed).toBe(true);
        for (const check of result.checks) {
            expect(check.pass).toBe(true);
        }
    });
});
