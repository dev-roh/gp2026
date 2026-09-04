# Blueprint & Plan: Collector Cash Handover PDF Receipt & Direct WhatsApp Sharing

## 1. Executive Summary & Objective
Provide Collectors and Treasurers with an official **Digital Cash Handover Voucher** that can be downloaded as a PDF or shared 1-click via WhatsApp whenever cash is transferred from a field collector to the Treasurer.

---

## 2. Technical Architecture & Components

### A. Global Terminology Update: Area / Wing Instead of Flat No
- Change **Flat No** to **Area / Wing** across the entire application (User Profiles, Contribution Forms, Digital Receipts, Handover Vouchers, CSV Reports, and Database Schema).

### B. Dynamic Handover Voucher Generator
- Create a dedicated Voucher Component / API view rendering an official **Cash Handover Receipt**.
- Fields included:
  - Handover Voucher Reference ID (`HND-2026-XXXX`)
  - Collector Name & Assigned **Area / Wing** (e.g. *Wing A / Sector 4*)
  - Treasurer Name (upon approval)
  - Amount Transferred (₹)
  - Approval Status (`PENDING`, `APPROVED`, `REJECTED`)
  - Date & Timestamp
  - Collector Notes

### C. Direct WhatsApp Share Link
- Formats a pre-populated WhatsApp message:
  ```text
  *Ganesh Puja 2026 - Cash Handover Voucher* 💸
  
  Voucher No: *HND-2026-001*
  Collector: *Amit Patel (Area: Wing A)*
  Handover Amount: *₹5,000*
  Status: *APPROVED*
  Approved By: *Rajesh Sharma (Treasurer)*
  
  View portal: https://gp2026.luhurachati.com
  ```

### D. Printable PDF Voucher Modal
- Add a **Printer / Share** button on every handover item card under the **Collectors** tab.
- Renders a clean, print-friendly voucher layout with `window.print()` / PDF export trigger.

---

## 3. Git Feature Branch Strategy
1. Branch out: `git checkout -b feature/collector-handover-pdf-whatsapp`
2. Implement PDF/Voucher modal component, Area/Wing terminology update, and WhatsApp sharing.
3. Test locally (`npm run dev` & `npm run build`).
4. Merge to `main` & push to GitHub for Vercel deployment.
5. Delete feature branch locally and remotely.
