# Specification Blueprint: Self-Contribution, Approval Matrix, Notification Center & OAuth Production Diagnostics

## PART 1: Production Google OAuth Fix ("Try signing with a different account")

### Root Cause Diagnosis:
The error *"Try signing with a different account"* on NextAuth occurs due to **OAuth Consent Screen Publishing State** or **Redirect URI domain mismatch**:
1. **Testing Status on Google Cloud Console**: If your Google OAuth App is set to **"Testing"** status, Google blocks any email address that is not explicitly added to the **Test Users** list.
2. **Missing Vercel Environment Variables**: Vercel production settings must have:
   - `NEXTAUTH_URL` = `https://gp2026.luhurachati.com`
   - `NEXTAUTH_SECRET` = `YOUR_32_CHAR_SECRET`
   - `GOOGLE_CLIENT_ID` = `YOUR_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET` = `YOUR_GOOGLE_CLIENT_SECRET`
3. **Google Authorized Redirect URIs**: Ensure `https://gp2026.luhurachati.com/api/auth/callback/google` is explicitly saved in Google Cloud Console.

---

## PART 2: Feature Blueprint - "Record Your Own Contribution", User Directory & Notifications

### 1. Self-Contribution Workflow Matrix

| User Role Submitting Self-Contribution | Tagged Responsible Person | Approval Workflow Required | Status Before Approval |
| :--- | :--- | :--- | :--- |
| **`VIEW_ONLY`** or **`MEMBER`** | Must select a **COLLECTOR** or **TREASURER** | Needs Collector/Treasurer Verification | `PENDING_COLLECTOR_APPROVAL` |
| **`COLLECTOR`** or **`TREASURER`** | System tags **SUPER_ADMIN** (`luhurenbaiclub@gmail.com`) | Needs **SUPER_ADMIN** Approval | `PENDING_SUPER_ADMIN_APPROVAL` |
| **`SUPER_ADMIN`** | N/A (Self-authorized) | Auto-Approved | `APPROVED` |

---

## PART 3: Implementation Roadmap & Git Branch Strategy
1. Feature Branch: `git checkout -b feature/self-contribution-notifications-users`
2. Update Database Schema in `src/lib/db.ts` with Notification & Self-Contribution Approval statuses.
3. Build `/api/users` endpoint for user directory listing.
4. Update `/api/finance` endpoint with approval state machine and notification dispatching.
5. Add Notification Bell Center & Approval Modals in `src/app/page.tsx`.
6. Test locally (`npm run dev` & `npm run build`).
7. Merge into `main`, push to GitHub for Vercel deployment, and clean up branch.
