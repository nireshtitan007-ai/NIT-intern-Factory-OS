# ZenLyft Manufacturing OS
### Order-to-Audit Operating System for Small Food Manufacturers
**Centre for Digital Infrastructure — NIT Tiruchirappalli Internship Evaluation**

[![CI](https://github.com/nireshtitan007-ai/NIT-intern-Factory-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/nireshtitan007-ai/NIT-intern-Factory-OS/actions/workflows/ci.yml)

---

## 1. Executive Summary

**ZenLyft Manufacturing OS** is a commercial-grade, offline-first enterprise manufacturing platform that takes a small food manufacturer from a route salesman's field mobile order all the way to the external auditor's monthly statutory tax filing.

It completely eliminates fragmented WhatsApp order re-entry, disconnected spreadsheets, paper-based floor logs, unnoticed production wastage, and month-end reconciliation bottlenecks by intertwining two core loops around an authoritative, immutable double-entry stock ledger:
1. **Sales & Billing Loop:** Mobile Order $\rightarrow$ Stock Availability Check $\rightarrow$ GST Tax Invoice $\rightarrow$ FEFO Dispatch $\rightarrow$ Payments & Receivables Aging.
2. **Production & Recipe Loop:** Raw Material Ingestion (WAC updated) $\rightarrow$ Production Run issued against BOM recipe $\rightarrow$ Finished Goods credit $\rightarrow$ Consumption & Yield Variance Alerting $\rightarrow$ Cost per Packet Allocation.

---

## 2. Quick Start & Clean-Clone Instructions

### Option A: Local Development Setup (Zero External Dependencies)

ZenLyft features a built-in in-memory database engine fallback, allowing the entire application and benchmark suite to boot with zero manual database installations.

```bash
# 1. Clone repository
git clone https://github.com/nireshtitan007-ai/NIT-intern-Factory-OS.git
cd "NIT-intern-Factory-OS"

# 2. Server setup (Node 18+ required)
cd server
npm install
npm test            # Runs all 9 comprehensive test suites (100+ tests)
npm run benchmark   # Executes the Section 5 NIT Trichy Benchmark Scenario

# 3. Start Backend API Server
npm run dev         # Starts backend at http://localhost:5000

# 4. In a second terminal, start Frontend Client
cd ../client
npm install
npm run build       # Verifies TypeScript compilation and bundle packaging
npm run dev         # Starts frontend at http://localhost:5173
```

### Option B: Docker Compose Setup (Single Command Boot)

```bash
docker compose up --build -d
```
- Client accessible at: `http://localhost:5173`
- Server API accessible at: `http://localhost:5000`
- Section 5 verification endpoint: `http://localhost:5000/api/benchmark/run`

---

## 3. Demo User Accounts & Access Matrix

ZenLyft enforces server-side Role-Based Access Control (RBAC) across all endpoints with tamper-evident audit logging.

| Username | Password | Role | Operational Scope |
|---|---|---|---|
| `factory_admin` | `Admin@123` | `admin` | Full platform control, order approvals, user administration, invoice cancellation. |
| `owner` | `Nash@123` | `owner` | Executive financial overview, revenue metrics, statutory tax summaries. |
| `salesman_a` | `Nash@123` | `salesman` | Offline-first field order terminal; route customers; view only own orders. |
| `supervisor` | `Nash@123` | `production` | Floor batch logger, recipe standard issue, scrap & overhead tracking. |
| `accountant` | `Nash@123` | `accountant` | Invoicing, collections recording, payment receipts, bank reconciliation. |
| `auditor` | `Nash@123` | `auditor` | **Strictly read-only** audit portal, GSTR-1, GSTR-3B, Excel (.xlsx) & PDF exports. |

---

## 4. Section 5 Mandatory Benchmark Verification (100% Passed)

To execute the benchmark verification suite, run:
```bash
npm run benchmark --prefix server
```

| Step | Metric | Expected Specification | System Result | Status |
|:---:|---|---|---|:---:|
| **1** | Flour closing balance | $100 + 60 - 40 = 120\text{ kg}$ | **120 kg** | **PASS** |
| **2** | Cooking oil closing balance | $30 - 10.5 = 19.5\text{ L}$ | **19.5 L** | **PASS** |
| **3** | Pouches closing balance | $500 - 188 - 6 = 306\text{ pcs}$ | **306 pcs** | **PASS** |
| **4** | Finished goods after dispatch | $50 + 188 - 150 = 88\text{ packets}$ | **88 packets** | **PASS** |
| **5** | Production yield variance | $188\text{ vs }200\text{ expected} = -6.00\%$ | **-6.00% (Flagged Red)** | **PASS** |
| **6** | Oil consumption variance | $10.5\text{ vs }10.0\text{ L} = +5.00\%$ | **+5.00% (Flagged Red)** | **PASS** |
| **7** | Retailer A GST Invoice | ₹7,500.00 + ₹187.50 CGST + ₹187.50 SGST | **₹7,875.00 Total** | **PASS** |
| **8** | Retailer A outstanding balance | $₹7,875.00 - ₹4,000.00 = ₹3,875.00$ | **₹3,875.00** | **PASS** |
| **9** | Distributor B order shortage | Shortage of 32 packets flagged ($88 < 120$) | **32 pkts Shortage Flagged** | **PASS** |

### Section 5.8 Cost Per Packet Mathematical Breakdown

$$\text{Total Production Cost} = \text{Direct Materials} + \text{Direct Labour} + \text{Factory Overhead}$$

- **Flour:** $40\text{ kg} \times ₹43.125\text{ (WAC)} = ₹1,725.00$
- **Cooking Oil:** $10.5\text{ L} \times ₹140.00/\text{L} = ₹1,470.00$
- **Spice Mix:** $1.2\text{ kg} \times ₹200.00/\text{kg} = ₹240.00$
- **Pouches:** $(188\text{ good} + 6\text{ damaged}) \times ₹2.50 = ₹485.00$
- **Cartons:** $9\text{ cartons} \times ₹15.00 = ₹135.00$
- **Direct Material Cost:** **₹4,055.00**
- **Direct Labour:** ₹1,200.00
- **Power & Gas Overhead:** ₹600.00
- **Total Batch Cost:** **₹5,855.00**
- **Unit Cost per Packet:** $\frac{₹5,855.00}{188\text{ packets}} = \mathbf{₹31.1436} \approx \mathbf{₹31.14}$

---

## 5. Core Mathematical & Accounting Invariants

### 1. Integer Paise Monetary Engine
To eradicate IEEE-754 floating-point drift, all database models store financial figures as **integer paise** ($1\text{ Rupee} = 100\text{ Paise}$). Line item taxes, grand totals, and payments satisfy:
$$\text{GrandTotalPaise} \equiv \text{TaxablePaise} + \text{CGSTPaise} + \text{SGSTPaise} + \text{IGSTPaise}$$
$$\text{BalanceDuePaise} \equiv \text{GrandTotalPaise} - \sum \text{PaymentPaise}$$

### 2. Weighted Average Costing (WAC)
Every inward purchase recalculates the unit rate without precision degradation:
$$\text{WAC}_{\text{new}} = \frac{(\text{CurrentStock} \times \text{CurrentRatePaise}) + (\text{InwardQuantity} \times \text{PurchaseRatePaise})}{\text{CurrentStock} + \text{InwardQuantity}}$$

For Flour in Step 1:
$$\text{WAC}_{\text{Flour}} = \frac{(100 \times 4,200) + (60 \times 4,500)}{160} = \frac{420,000 + 270,000}{160} = 4,312.5\text{ paise} = \mathbf{₹43.125/\text{kg}}$$

### 3. Immutable Stock Ledger Invariant
No inventory quantity is ever directly edited. Every change is an append-only `StockMovement` row:
$$\text{CurrentStock}_t = \text{CurrentStock}_0 + \sum_{i=1}^t \Delta Q_i$$
Outward movements check:
$$\text{AvailableStock} - \text{DispatchQuantity} \ge 0$$
Any attempt to drive stock negative throws a strict transactional exception.
