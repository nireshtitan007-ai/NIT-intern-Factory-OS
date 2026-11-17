# ZenLyft Manufacturing Business OS
### Order-to-Audit System for Small Food Manufacturers
**Centre for Digital Infrastructure — NIT Tiruchirappalli Internship Evaluation**

---

## 1. Executive Summary

**ZenLyft Manufacturing OS** is a unified, offline-first enterprise manufacturing platform that takes a small food factory from a salesman's mobile order to the external auditor's monthly tax return.

It completely eliminates fragmented WhatsApp order re-entry, disconnected spreadsheets, unnoticed production wastage, and month-end reconciliation headaches by intertwining the two core loops:
1. **Sales & Billing Loop:** Mobile Order $\rightarrow$ Stock Coverage Check $\rightarrow$ GST Tax Invoice $\rightarrow$ Dispatch (FG stock deducted) $\rightarrow$ Payments & Receivables.
2. **Production & Recipe Loop:** Raw Material Purchase (WAC updated) $\rightarrow$ Production Run issued against BOM $\rightarrow$ FG stock credited $\rightarrow$ Consumption & Yield Variance Alerting $\rightarrow$ Unit Cost per Packet.

Both loops converge on an **authoritative, immutable double-entry Stock Movement Ledger**.

---

## 2. Technology Stack & Architecture Decision

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Dexie.js (IndexedDB PWA).
  - *Why:* Instant sub-second UI interactions, zero runtime overhead, responsive layout tailored for mobile field salesmen and desktop factory administrators.
- **Offline Storage:** Dexie.js (IndexedDB wrapper).
  - *Why:* Enables salesmen on weak rural cellular networks to browse products, select customers, and queue orders locally without data loss. Queued orders synchronize idempotently when connectivity resumes.
- **Backend API:** Node.js, Express, TypeScript.
  - *Why:* Zero impedance mismatch with frontend TypeScript interfaces; strict schema validation; native support for streaming PDF invoices (`PDFKit`) and CSV registers (`csv-stringify`); lightweight modular monolith structure.
- **Database & Stock Ledger:** MongoDB with Mongoose.
  - *Why:* Document-oriented flexibility for dynamic BOM recipes, nested line items, and high-performance querying. Includes built-in embedded in-memory database engine for zero-dependency local evaluations, with full support for external MongoDB Atlas instances.
- **Precision Monetary Math:** Fixed-decimal minor unit calculations preventing floating-point rounding errors on GST taxes and inventory valuations.

---

## 3. Section 5 Mandatory Benchmark Results (100% Passed)

To verify compliance, execute `npm run benchmark` or click **"Run Benchmark"** in the top navigation bar.

| Step | Metric | Expected Result | Actual System Result | Pass / Fail |
|---|---|---|---|:---:|
| 1 | Flour closing balance | 120 kg (100 + 60 − 40) | **120 kg** | **MATCH (PASS)** |
| 2 | Cooking oil closing balance | 19.5 L (30 − 10.5) | **19.5 L** | **MATCH (PASS)** |
| 3 | Pouches closing balance | 306 pcs (500 − 188 − 6) | **306 pcs** | **MATCH (PASS)** |
| 4 | Finished goods after Retailer A dispatch | 88 packets (50 + 188 − 150) | **88 packets** | **MATCH (PASS)** |
| 5 | Production yield variance | 188 vs 200 expected, −6%, flagged | **-6.00% (Flagged in Red)** | **MATCH (PASS)** |
| 6 | Oil consumption variance | 10.5 vs 10 L standard, +5%, flagged | **+5.00% (Flagged in Red)** | **MATCH (PASS)** |
| 7 | Retailer A GST Invoice | ₹7,500 taxable + ₹187.50 CGST + ₹187.50 SGST = ₹7,875 | **₹7,500.00 + ₹187.50 + ₹187.50 = ₹7,875.00** | **MATCH (PASS)** |
| 8 | Retailer A outstanding after payment | ₹3,875 (₹7,875 − ₹4,000) | **₹3,875.00** | **MATCH (PASS)** |
| 9 | Distributor B order handling | Shortage of 32 packets flagged (88 avail vs 120 req) | **32 packets shortage flagged** | **MATCH (PASS)** |

### Cost Per Packet Breakdown (Step 8)
- **Flour (WAC rate ₹43.125/kg $\times$ 40 kg):** ₹1,725.00
- **Cooking Oil (₹140/L $\times$ 10.5 L):** ₹1,470.00
- **Spice Mix (₹200/kg $\times$ 1.2 kg):** ₹240.00
- **Pouches ((188 good + 6 damaged) $\times$ ₹2.50):** ₹485.00
- **Cartons (9 pcs $\times$ ₹15.00):** ₹135.00
- **Total Direct Materials:** ₹4,055.00
- **Direct Labour:** ₹1,200.00
- **Power & Gas Overhead:** ₹600.00
- **Total Production Cost:** **₹5,855.00**
- **Cost Per Packet:** $₹5,855.00 / 188 = \mathbf{₹31.14 / \text{packet}}$
- **Selling Price:** ₹50.00 / packet
- **Gross Profit Margin:** $\mathbf{₹18.86 / \text{packet} \ (37.72\%)}$

---

## 4. Scope & Feature Tiers Built

### Must-Have Features (Fully Functional)
- [x] **Role-Based Views:** Instant switching across Salesman, Factory Admin, Production Supervisor, Inventory Manager, and Auditor.
- [x] **Master Data:** Pre-configured products (Murukku 200g), raw materials, packaging, customers (Retailer A, Distributor B), and BOMs.
- [x] **Mobile Order Taking:** Touch-friendly salesman order booking in under 30 seconds with quick packet increment buttons.
- [x] **GST Tax Invoices:** Taxable values, automatic place of supply detection (CGST/SGST for intra-state TN, IGST for inter-state KA), financial year numbering (`INV/2024-25/001`).
- [x] **Downloadable PDF Invoices:** Printable, branded GST tax invoice generated on the fly via `PDFKit`.
- [x] **Production Variance Engine:** Automatic calculation of consumption variance (e.g. +5% oil) and yield variance (e.g. -6% yield) with tolerance alerting ($\pm 3\%$).
- [x] **Authoritative Stock Ledger:** Immutable ledger linking every transaction to its source document (`PO`, `PR`, `INV`).
- [x] **Auditor Exports:** 1-click export of Sales Register, Stock Summary, and Production Reports to CSV.

### Should-Have Features (Fully Functional)
- [x] **Purchase Management:** Supplier purchase receipts with automatic Weighted Average Cost recalculation.
- [x] **Payments & Receivables Aging:** Partial payment allocation with 0-30, 31-60, 61-90, and >90 days aging buckets.
- [x] **Costing with Overheads:** Raw material valuation + direct labour + power/gas overheads = exact cost per packet and gross margin.
- [x] **GST Summary Report:** Outward supplies categorized for immediate filing in GSTR-1 and GSTR-3B.
- [x] **Owner Dashboard:** Live executive summary with turnover, collections, inventory exposure, and variance alerts.

### Stretch Goals Implemented
- [x] **Offline-First Order Capture & Sync:** Integrated Dexie.js (IndexedDB) queue and offline simulation mode.
- [x] **Shortage Flagging:** Preserves customer requested quantities without silent alteration when stock is insufficient.
- [x] **Tamper-Proof Audit Trail:** Full event logging recording user, action, entity, and timestamp.

---

## 5. Quick Start & Execution

### Prerequisites
- Node.js `v18+` or `v22+`
- NPM `v9+` or `v10+`

### 1. Installation
```bash
# Clone the repository and install dependencies
npm install --prefix server
npm install --prefix client
```

### 2. Run Automated Benchmark Acceptance Test
```bash
# Runs the Section 5 benchmark test suite in Jest
npm test
```
*Expected Output:* `PASS tests/benchmark.test.ts - should execute Section 5 Benchmark end-to-end and pass 100% of audit checks.`

### 3. Run Standalone Benchmark Verification Script
```bash
npm run benchmark
```
*Prints the full 9-step scenario and benchmark audit table directly in the console.*

### 4. Start the Application Locally
In two terminal windows:
```bash
# Terminal 1: Start Backend API (Port 5000)
npm run dev:server

# Terminal 2: Start React Frontend (Port 5173)
npm run dev:client
```
Open **`http://localhost:5173`** in your browser.

---

## 6. Role Test Credentials & Demonstration Guide

Use the top navigation bar to seamlessly switch between roles:

1. **📱 Salesman Mobile View:**
   - Select **Retailer A** or **Distributor B**.
   - Tap `150 pkts` or `120 pkts` and submit.
   - Toggle **"Offline Mode"** in the top bar to simulate ordering in a rural area with weak reception; watch the order queue in IndexedDB and click **"Sync Pending Orders"** when back online.
2. **🖥️ Factory Admin Desk:**
   - Review incoming orders. Observe stock coverage indicators (green for sufficient stock, red badge for 32 pkts shortage).
   - Click **"Approve & Raise GST Invoice"**.
   - Click **"PDF"** to view/download the tax invoice.
   - Click **"Dispatch"** to deduct stock.
   - Use the payment card to record a ₹4,000 collection and watch the balance drop to ₹3,875.
3. **⚙️ Production Floor:**
   - Inspect the recipe for Murukku 200 g.
   - Enter actual quantities (Flour: 40 kg, Oil: 10.5 L, Spices: 1.2 kg, Output: 188 pkts, Damaged: 6 pouches, Cartons: 9).
   - Enter Labour (₹1,200) and Power/Gas (₹600).
   - Click **"Save Production Run"** to see automatic inventory deduction and cost per packet (₹31.14) calculation.
4. **📦 Inventory & Ledger:**
   - View always-current stock balances: Flour: 120 kg, Oil: 19.5 L, Pouches: 306 pcs, Murukku: 88 pkts.
   - Inspect the granular movement ledger tracing every unit back to its source document.
5. **📑 Auditor Desk:**
   - Review Sales Register, GSTR-1 outward supply summary, and Receivables aging. Export any table to CSV with 1 click.
6. **👑 Business Owner Command Centre:**
   - Review overall factory revenue, gross profit margin (37.7%), and live benchmark verification metrics.
