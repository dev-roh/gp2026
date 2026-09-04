# Role-Based Access Control (RBAC) Architecture & Strategy

## 1. Overview & Core Philosophy
The Ganesh Puja 2026 Financial Application relies on strict, role-based boundaries to prevent unauthorized balance modifications, fake expense approvals, or unverified cash handovers.

---

## 2. Defined Roles & Capabilities

| Permission / Action | MEMBER | COLLECTOR | TREASURER / ADMIN |
| :--- | :---: | :---: | :---: |
| **View Dashboard & Audit Reports** | ✅ | ✅ | ✅ |
| **View Personal Receipts & WhatsApp Share** | ✅ | ✅ | ✅ |
| **Log Personal Out-of-Pocket Expense** | ✅ | ✅ | ✅ |
| **Record Member Cash / UPI Collection** | ❌ | ✅ | ✅ |
| **Manage Cash Sub-Ledger & Request Handover** | ❌ | ✅ | ✅ |
| **Approve Collector Cash Handover** | ❌ | ❌ | ✅ |
| **Settle Out-of-Pocket Reimbursements** | ❌ | ❌ | ✅ |
| **Export Complete Financial CSV Audit Log** | ❌ | ❌ | ✅ |

---

## 3. RBAC Technical Implementation Plan

1. **NextAuth JWT Role Injection**:
   - Inspect email address during OAuth authentication.
   - If email exists in `ADMIN_EMAILS`, assign `ADMIN` / `TREASURER` role.
   - If user exists in `COLLECTOR_EMAILS`, assign `COLLECTOR` role.
   - Otherwise, default to `MEMBER` role.

2. **Middleware & API Route Guards**:
   - Endpoints like `APPROVE_HANDOVER` & `SETTLE_REIMBURSEMENT` verify `session.user.role === 'ADMIN' || session.user.role === 'TREASURER'`.
   - Returns `403 Forbidden` for unauthorized role attempts.

3. **Client-Side UI Scoping**:
   - Action buttons (e.g. `Approve Handover`, `Settle Balance`) render exclusively for `ADMIN`/`TREASURER` roles.
