import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { createApp } from '../server/src/app';
import { connectDB, disconnectDB } from '../server/src/config/db';
import { seedBenchmarkData } from '../server/src/scripts/seedBenchmark';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 5055;
const BASE_URL = `http://localhost:${PORT}`;
const SCREENSHOTS_DIR = path.resolve(__dirname, '../docs/screenshots');

async function main() {
  console.log('[Screenshots] Initializing automated visual tour pipeline...');
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // 1. Connect DB & Seed Benchmark Data
  await connectDB();
  await seedBenchmarkData();

  // 2. Start Express app serving both API and Client dist
  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`[Screenshots] Unified server listening on port ${PORT}`);
  });

  // 3. Launch Chrome Headless
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[Browser Console]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('[Browser PageError]', err));

  const waitAndSave = async (filename: string, delayMs: number = 2200) => {
    await new Promise(r => setTimeout(r, delayMs));
    const dest = path.join(SCREENSHOTS_DIR, filename);
    await page.screenshot({ path: dest });
    console.log(`[Screenshots] Saved: docs/screenshots/${filename} (${fs.statSync(dest).size} bytes)`);
  };

  const clickNav = async (label: string) => {
    await page.evaluate(`((l) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent && b.textContent.includes(l));
      if (btn) btn.click();
    })(${JSON.stringify(label)})`);
  };

  try {
    // 1. Login Gateway
    console.log('[Screenshots] Capturing 01-login-gateway.png...');
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await page.evaluate(`(() => { localStorage.clear(); })()`);
    await page.reload({ waitUntil: 'load' });
    await waitAndSave('01-login-gateway.png', 1500);

    // Login as Admin
    console.log('[Screenshots] Logging in as Admin...');
    await page.evaluate(async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'factory_admin', password: 'Admin@123' })
      });
      const data: any = await res.json();
      if (data.token) {
        localStorage.setItem('zenlyft_token', data.token);
        localStorage.setItem('zenlyft_auth_token', data.token);
        localStorage.setItem('zenlyft_user', JSON.stringify(data.user));
      }
    });
    await page.goto(BASE_URL, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 2000));

    // 2. Admin Overview
    console.log('[Screenshots] Capturing 02-admin-overview.png...');
    await clickNav('Admin Control Centre');
    await waitAndSave('02-admin-overview.png', 2000);

    // 3. Admin Billing Desk & Invoicing
    console.log('[Screenshots] Capturing 03-admin-billing-desk.png...');
    await clickNav('Order Desk & Invoicing');
    await waitAndSave('03-admin-billing-desk.png', 2000);

    // 4. Admin Master Data
    console.log('[Screenshots] Capturing 04-admin-masters.png...');
    await clickNav('Master Data');
    await waitAndSave('04-admin-masters.png', 2000);

    // 5. Central Inventory & Stock Ledger
    console.log('[Screenshots] Capturing 08-central-inventory.png...');
    await clickNav('Central Inventory');
    await waitAndSave('08-central-inventory.png', 2500);

    // 6. Owner Intelligence & Audit Trail
    console.log('[Screenshots] Capturing 10-owner-intelligence.png...');
    await clickNav('Owner Intelligence');
    await waitAndSave('10-owner-intelligence.png', 2500);

    // 7. Statutory Auditor Portal & Registers
    console.log('[Screenshots] Capturing 09-auditor-portal.png...');
    await clickNav('Auditor Portal');
    await waitAndSave('09-auditor-portal.png', 2500);

    // 8. Production Floor (English)
    console.log('[Screenshots] Capturing 06-production-floor-en.png...');
    await clickNav('Production Floor');
    await waitAndSave('06-production-floor-en.png', 2500);

    // 9. Production Floor (Tamil Localization)
    console.log('[Screenshots] Capturing 07-production-floor-ta.png...');
    await clickNav('தமிழ்');
    await waitAndSave('07-production-floor-ta.png', 1800);
    // Switch back to English
    await clickNav('English');

    // 10. Salesman Rapid Order Entry & PWA
    console.log('[Screenshots] Capturing 05-salesman-pwa.png...');
    await clickNav('Field Terminal');
    await waitAndSave('05-salesman-pwa.png', 2500);

    // 11. Section 5 Benchmark Execution Modal
    console.log('[Screenshots] Capturing 11-benchmark-modal.png...');
    await page.evaluate(`(() => {
      const userBtn = document.querySelector('button[title="User account & profile"]');
      if (userBtn) userBtn.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));
    await clickNav('Run NIT Benchmark');
    await new Promise(r => setTimeout(r, 7000));
    await waitAndSave('11-benchmark-modal.png', 1500);

    console.log('[Screenshots] ✓ All 11 screenshots successfully captured and saved in docs/screenshots/');
  } catch (err) {
    console.error('[Screenshots] Error during screenshot pipeline:', err);
  } finally {
    await browser.close();
    server.close();
    await disconnectDB();
    console.log('[Screenshots] Pipeline finished cleanly.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
