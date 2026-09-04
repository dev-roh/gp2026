# Ganesh Puja 2026 Financial App - Progress Tracker & Docs

## Progress Log

### Completed Steps
1. **Architecture Blueprint & Specs**: Formulated comprehensive mobile-first design strategy in [docs/plan.md](file:///home/rohit/ganesh_puja_2026/docs/plan.md).
2. **Framework & Database Engine**: Built Next.js (App Router, TypeScript, Tailwind CSS) SPA with local-first JSON & Prisma ORM database engine in [src/lib/db.ts](file:///home/rohit/ganesh_puja_2026/src/lib/db.ts).
3. **Core API Routes**: Created REST APIs for Collections, Expenses, Collector Sub-ledgers, Handovers, and CSV Audit Report Generation in [src/app/api/finance/route.ts](file:///home/rohit/ganesh_puja_2026/src/app/api/finance/route.ts).
4. **Mobile Dashboard UI**: Implemented dark, high-trust touch-friendly interface in [src/app/page.tsx](file:///home/rohit/ganesh_puja_2026/src/app/page.tsx) featuring:
   - Live Target Goal Progress Bar & Treasury Vault totals.
   - Collector cash balance tracking & Handover approval workflow.
   - Expense logging with Out-of-Pocket reimbursement tracking.
   - **Digital Receipt Modal**: View individual receipts with 1-click **WhatsApp instant share**.
   - **Export CSV Button**: Download complete financial ledger audit report.
5. **Google OAuth & NextAuth Security**:
   - Integrated NextAuth Google Provider in [src/lib/auth.ts](file:///home/rohit/ganesh_puja_2026/src/lib/auth.ts).
   - Resolved OAuth callback redirect loop issues and whitelisted static assets in [src/middleware.ts](file:///home/rohit/ganesh_puja_2026/src/middleware.ts).
6. **Serverless Role-Based Access Control (RBAC)**:
   - Immutable Super Admin root anchor for `luhurenbaiclub@gmail.com`.
   - Default **`VIEW_ONLY`** read-only role for 1st-time user logins.
   - Super Admin Role Console in [src/app/api/admin/roles/route.ts](file:///home/rohit/ganesh_puja_2026/src/app/api/admin/roles/route.ts).
7. **Super Admin Branding & Customization Feature** *(Built via `feature/admin-customization-branding` branch)*:
   - **Image Upload for App Logo**: Support for uploading custom logos rendered dynamically across the app header, sign-in prompt, and digital WhatsApp receipts.
   - **Color Theme Selector**: Real-time visual theme selection (`Amber Orange`, `Emerald Green`, `Slate Blue`, `Purple Gold`).
   - **Custom UI Button & Goal Labels**: Ability to customize collection buttons, spend buttons, handover buttons, app titles, and target amounts dynamically in [src/app/api/admin/settings/route.ts](file:///home/rohit/ganesh_puja_2026/src/app/api/admin/settings/route.ts).

---

## Deployment & Domain Setup (`gp2026.luhurachati.com`)

### 1. Vercel Deployment Setup
1. Push repository code to GitHub (`dev-roh/gp2026`).
2. Import project in Vercel.
3. Add Environment Variables in Vercel project settings:
   - `NEXTAUTH_SECRET`: Generate a random secret string.
   - `NEXTAUTH_URL`: `https://gp2026.luhurachati.com`
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID.
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret.

### 2. Wix DNS Record Setup for Custom Subdomain
In your Wix Domain Management for `luhurachati.com`:
- Add a new **CNAME** Record:
  - **Host / Name**: `gp2026`
  - **Points to / Value**: `cname.vercel-dns.com`
  - **TTL**: Auto / 1 Hour
