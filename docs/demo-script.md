# ZenLyft Manufacturing OS — 8-Minute Evaluation & Investor Demo Script
**Centre for Digital Infrastructure, NIT Tiruchirappalli Internship Task**

---

## Target Audience & Objective
- **Evaluators / Factory Owners / Investors:** Demonstrate how ZenLyft replaces WhatsApp, Excel, and paper floor logs with a single real-time operating system that guarantees 100% Section 5 benchmark correctness.
- **Estimated Run Time:** 8 minutes.

---

## Phase 1: Problem Context & Architecture (0:00 – 1:30)
1. **The Core Problem in Small Food Manufacturing:**
   - "Small packaged snack manufacturers in Tamil Nadu have salesmen taking orders via WhatsApp, floor supervisors logging recipes on paper boards, and accountants manually piecing together GST returns at month end."
   - "The consequence: stock discrepancies, unnoticed raw material wastage, unknown unit packet cost, and an auditor who can't reconcile books."
2. **The ZenLyft Solution:**
   - "ZenLyft is built on one principle: **Order-to-Audit in one system, works offline, GST-correct.**"
   - "Every transaction is captured once at its source, and simultaneously updates physical inventory, double-entry stock ledgers, financial receivables, and statutory tax registers."

---

## Phase 2: Section 5 Benchmark Execution (1:30 – 3:00)
1. **Live Benchmark Engine:**
   - Switch to terminal: `npm run benchmark --prefix server` (or click **"Verify Section 5 Benchmark"** in top bar).
   - Walk through the output table:
     - **Flour Closing Balance:** $100\text{ kg} + 60\text{ kg (purchased at ₹45)} - 40\text{ kg (used)} = \mathbf{120\text{ kg}}$
     - **Weighted Average Cost (WAC):** $\frac{(100 \times 42) + (60 \times 45)}{160} = \mathbf{₹43.125/\text{kg}}$
     - **Oil Closing Balance:** $30\text{ L} - 10.5\text{ L} = \mathbf{19.5\text{ L}}$
     - **Pouches Closing Balance:** $500 - 188 - 6\text{ (damaged)} = \mathbf{306\text{ pcs}}$
     - **Finished Goods Stock:** $50 + 188 - 150 = \mathbf{88\text{ packets}}$
     - **Cost Per Packet:** $\mathbf{₹31.14/\text{packet}}$
     - **Variance Alerting:** Yield variance of $-6\%$ and Oil variance of $+5\%$ automatically flagged in red beyond the $\pm 3\%$ recipe tolerance.

---

## Phase 3: Route Salesman Field Workflow & PWA Offline Sync (3:00 – 4:30)
1. **Salesman Mobile Login:**
   - Log in as `salesman_a` (`ZenLyft@123`).
   - Notice salesman sees **only their own assigned customers and orders** (strict server-side multi-user privacy).
2. **Offline-First Ordering (Dexie IndexedDB Queue & Service Worker Caching):**
   - **Manual Offline Check Protocol:**
     1. Open Chrome DevTools (`F12`), navigate to **Network** tab, and set throttling to **Offline** (or toggle **"Simulate Offline"** in the top navigation bar).
     2. Notice product and customer catalogs remain instantly accessible via Workbox `stale-while-revalidate` cache.
     3. Select **Retailer A**, choose **Murukku 200g**, and use rapid stepper buttons (`+50`, `+100`) to set quantity to **150 packets** in under 15 seconds.
     4. Click **"Queue Offline Order"**.
     5. Notice the **Queued: 1** counter badge lights up, stored locally in **Dexie.js IndexedDB** with simulated GPS check-in metadata.
     6. Switch DevTools Network back to **No throttling** (or toggle Online).
     7. The background `window.addEventListener('online')` listener triggers automatically, syncing the queued batch idempotently via `POST /api/orders/sync-batch`.
     8. Counter updates to **Synced: 1, Queued: 0** with server order confirmation.
3. **Route Performance Dashboard:**
   - Switch to the **"My Sales Performance"** tab.
   - View real-time aggregated metrics from `GET /api/orders/mine/summary`: total revenue, order count by status, customer leaderboard, and recent dispatches.

---

## Phase 4: Production Floor & BOM Variance Engine (4:30 – 5:45)
1. **Production Supervisor Login:**
   - Switch to `supervisor` (`ZenLyft@123`).
2. **Standard Recipe (BOM) & Scaled Batch Issue:**
   - Show the BOM for **Murukku 200g**: standard batch produces 200 packets using 40 kg flour, 10 L oil, 1.2 kg spice mix, 200 pouches, and 10 cartons.
3. **Daily Run Logging:**
   - Input actual floor metrics: 40 kg flour, 10.5 L oil (+5% variance), 188 good packets (-6% yield), 6 damaged pouches, ₹1,200 labour, and ₹600 power overhead.
   - Hit **"Log Production Run"**:
     - System updates raw material ledgers atomically.
     - Adds 188 packets to finished goods.
     - Computes unit packet cost: **₹31.14**.

---

## Phase 5: Admin Control Desk & FEFO Dispatch (5:45 – 6:45)
1. **Admin Control Desk:**
   - Switch to `factory_admin` (`Admin@123`).
2. **Stock Coverage & Shortage Protection:**
   - Retailer A's order for 150 packets has sufficient stock (238 pkts available) $\rightarrow$ Approve order.
   - Invoice generated: `INV/2026-27/0001` with **Place of Supply: Tamil Nadu (33)**:
     - Taxable: ₹7,500.00
     - CGST (2.5%): ₹187.50
     - SGST (2.5%): ₹187.50
     - **Grand Total: ₹7,875.00**
   - Distributor B's order for 120 packets $\rightarrow$ System warns **"Shortage of 32 packets"** ($88 < 120$) without silently altering customer's requested quantity.
3. **Payment Collection:**
   - Record payment of ₹4,000 from Retailer A.
   - Outstanding balance drops instantly to **₹3,875.00**.

---

## Phase 6: External Auditor Portal & Multi-Format Exports (6:45 – 8:00)
1. **Auditor Portal:**
   - Log in as `auditor` (`Nash@123`).
   - Notice all mutating buttons are disabled: **Auditor is strictly read-only**.
2. **GSTR-1 & GSTR-3B Tax Summary:**
   - Review Table 4 (B2B Supplies) and Table 12 (HSN Summary).
   - Demonstrate date-range filtering (ISO `from` and `to`).
3. **Multi-Format Statutory Exports:**
   - Click **"Excel (.xlsx)"**: downloads complete workbook with formatted currency and totals row.
   - Click **"CSV"**: exports clean data for auditor software import.
   - Click **"PDF"**: streams branded printable audit schedule.
4. **Closing Statement:**
   - "ZenLyft is fully verified, mathematically sound, offline-first, and investor-ready for small manufacturing enterprises across India."
