# Architecture Blueprint & Implementation Plan: Ganesh Puja 2026 Finance App

## 1. Executive Summary & Core Objective
The **Ganesh Puja 2026 Finance App** (`gp2026.luhurachati.com`) is a mobile-first, high-trust single-page application (SPA) built using Next.js (TypeScript), Tailwind CSS / Vanilla CSS clean aesthetics, NextAuth.js (Google OAuth), and Supabase / Prisma (or Local SQLite + PostgreSQL hybrid). 

It is designed to solve collection irregularities, ensure complete transparency of member contributions, track individual collectors vs group master vaults, and maintain accurate accounting when individuals pay expenses out-of-pocket.

---

## 2. Core Architecture & Tech Stack

- **Framework**: Next.js 14/15 (App Router, TypeScript, React)
- **Styling**: Tailwind CSS + Custom CSS Variables (Sleek, mobile-optimized, clean, non-flashy colors, card-based touch UI)
- **Authentication**: NextAuth.js (Google OAuth 2.0 with restricted email domain or admin approval workflow)
- **Database & Storage**: Prisma ORM with SQLite (Local-first / Offline-capable / Mocked Dev Mode) transitioning seamlessly to PostgreSQL / Supabase for Vercel production.
- **Deployment**: Vercel (`gp2026.luhurachati.com` CNAME pointing to Vercel deployment, with Wix DNS routing)

---

## 3. Key Feature Modules

### A. Authentication & Role-Based Access Control (RBAC)
- **Google OAuth Login**: Easy touch login for mobile users.
- **Roles**:
  - `Admin / Treasurer`: Full control, verify payments, approve spend reimbursements, record master ledger entries.
  - `Collector`: Record member contributions collected on the field, manage personal sub-vaults/balances.
  - `Member / Contributor`: View public transparency dashboard, personal contribution history, submit expense out-of-pocket receipts.

### B. Member & Contribution Management
- **Member Directory**: Track flat numbers, names, phone numbers, target contribution amounts.
- **Collection Tracker**:
  - Instant digital receipt generation (WhatsApp / SMS downloadable summary).
  - Mode of payment (Cash, UPI / QR, NetBanking).
  - Collector attribution (tracks which collector collected cash vs directly sent to Master Bank account).

### C. Individual Collector vs. Master Vault Ledger
- **Collector Sub-Ledger**: Tracks cash held physically by collectors before handing over to Treasurer.
- **Handover Workflow**: Collectors mark "Handed over $X cash to Treasurer" -> Treasurer approves -> Cash moves from Collector balance to Master Vault.

### D. Expense Management & Out-of-Pocket Reimbursements
- **Direct Expense**: Spent directly from Master Bank Account / Cash Vault.
- **Out-of-Pocket Spend by Individual**:
  - Member/Organizer buys items (decorations, idol, prasadam) using personal funds.
  - System logs: `Expense logged` + `Reimbursement Owed to Member`.
  - Treasurer reimburses member -> System settles individual balance to 0 and logs master outflow.

### E. Analytics, Transparency & Audit Trail
- Real-time Total Collected vs Spent vs Target progress bar.
- Immutable log of all transactions with timestamps & actor tracking.
- Filterable reports (Export to CSV / PDF).

---

## 4. Phased Implementation Roadmap

- [ ] **Phase 1: Project Setup & Docs Foundation**
  - Initialize Next.js project in root directory with TypeScript & Tailwind CSS.
  - Set up `docs/` progress tracker and dev log.
- [ ] **Phase 2: Database Schema & Authentication**
  - Setup NextAuth with Google Provider (with mock fallback for local dev).
  - Define Prisma schema (Users, Members, Contributions, Expenses, Handovers, AuditLogs).
- [ ] **Phase 3: Mobile-First Core UI Components**
  - Mobile bottom navigation bar, quick action floating action buttons (FAB).
  - Summary KPI cards (Master Treasury, Collector Balances, Pending Reimbursements).
- [ ] **Phase 4: Collection & Collector Sub-Ledger Workflows**
  - Record Contribution UI with collector assignment.
  - Handover cash flow (Collector -> Treasurer approval).
- [ ] **Phase 5: Expense & Out-of-Pocket Reimbursements**
  - Record Spend UI with bill upload preview.
  - Settle Out-of-pocket balance workflow.
- [ ] **Phase 6: Vercel & Domain Deployment Guide**
  - Vercel project link setup.
  - DNS Configuration instructions for `gp2026.luhurachati.com` (Wix CNAME to Vercel).

---

## 5. Decision Request
Please review this plan. Upon your approval, we will immediately execute Phase 1 & 2 without further prompt interruptions, updating `docs/` continuous progress logs as we proceed.
