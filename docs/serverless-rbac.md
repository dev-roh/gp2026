# How to Achieve Secure Serverless RBAC Without a Traditional Backend

## 1. Executive Summary
You can achieve complete, tamper-proof Role-Based Access Control (RBAC) in a Next.js App Router app deployed on Vercel **without running a dedicated 24/7 backend server** by leveraging **JWT (JSON Web Tokens) with Server-Side Signing**, **Vercel KV / Edge Storage (or JSON storage)**, and **Super Admin Bootstrap Locking**.

---

## 2. Architecture & Design Principles

```
+-----------------------------------------------------------------------+
|                         User Logs In via Google                       |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| NextAuth Callback (Server-Side) Checks User Email                     |
|                                                                       |
|  1. If email === 'luhurenbaiclub@gmail.com':                          |
|     => Assign Role: SUPER_ADMIN (Hardcoded Core Security Root)        |
|                                                                       |
|  2. Else: Check Roles Registry (KV / File Store / DB)                 |
|     => If assigned in store: Assign stored role (COLLECTOR/TREASURER) |
|     => If NOT in store: Default to VIEW_ONLY                          |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| NextAuth Signs an Encrypted HTTP-Only Cookie JWT                      |
| (Contains user email + assigned role, signed with NEXTAUTH_SECRET)    |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
| Every API Route / Action Validates the Signed JWT                     |
| - VIEW_ONLY users trying to POST/UPDATE => 403 Forbidden              |
| - SUPER_ADMIN can hit POST /api/admin/assign-role                     |
+-----------------------------------------------------------------------+
```

---

## 3. Step-by-Step Implementation Strategy

### A. Super Admin Hardcoded Lock (Bootstrap Anchor)
- `luhurenbaiclub@gmail.com` is hardcoded as the immutable **SUPER_ADMIN** in server-side configuration.
- No user or hacker can revoke or alter this super admin anchor.

### B. Default `VIEW_ONLY` Role for First-Time Users
- When any new Google account logs in for the first time, NextAuth evaluates their email.
- If the email has not been explicitly promoted by the Super Admin, the server assigns `role = 'VIEW_ONLY'`.
- `VIEW_ONLY` users can strictly browse the public collection progress, spend ledger, and view receipts, but **all creation/edit buttons are hidden or return 403 Forbidden**.

### C. Super Admin Role Management Panel & Secure API
- A dedicated **Admin Console UI** accessible *only* to `luhurenbaiclub@gmail.com`.
- The Super Admin inputs an email (e.g. `collector1@gmail.com`) and selects a target role (`COLLECTOR`, `TREASURER`, `MEMBER`).
- Sending request to `/api/admin/assign-role`:
  - Server verifies `session.user.email === 'luhurenbaiclub@gmail.com'`.
  - Updates the role mapping in persistent JSON/KV storage.
  - Next time that user logs in, NextAuth automatically issues them their updated role.

---

## 4. Role Hierarchy Overview

| Role | Permissions & Access Level |
| :--- | :--- |
| **`SUPER_ADMIN`** (`luhurenbaiclub@gmail.com`) | Full System Control + Ability to assign/revoke user roles. |
| **`TREASURER`** | Approve Cash Handovers, Settle Out-of-Pocket Reimbursements, Export CSV Audit Reports. |
| **`COLLECTOR`** | Record Member Contributions, Manage Cash Sub-Ledger, Submit Handover Requests. |
| **`MEMBER`** | Submit personal out-of-pocket expenses, view personal contribution receipts. |
| **`VIEW_ONLY`** (Default for 1st Login) | **Read-Only access** to total collections, spend summary, and progress bars. Cannot create or edit anything. |
