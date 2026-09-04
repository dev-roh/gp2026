# Specification & Blueprint: Super Admin Branding & Customization Feature

## 1. Objective
Provide the `SUPER_ADMIN` (`luhurenbaiclub@gmail.com`) with a dynamic **App Customization & Branding Console** to customize the app's visual identity, label terminology, logo image, and color theme without code rebuilds.

---

## 2. Feature Components & Requirements

### A. Dynamic Theme & Branding Settings Schema
The system configuration will store:
- **Logo Settings**: Custom Image URL or Base64 / uploaded image for the app header and digital receipts.
- **Color Theme**:
  - `AMBER_ORANGE` (Default Puja Warm Gold)
  - `EMERALD_GREEN` (Royal Prosperity)
  - `SLATE_BLUE` (Modern Minimalist)
  - `PURPLE_GOLD` (Festive Premium)
- **Customizable Labels**:
  - `appTitle`: (Default: *"GP 2026 Finance"*)
  - `targetGoalLabel`: (Default: *"Target Fund Goal"*)
  - `collectionButtonLabel`: (Default: *"+ Collection"*)
  - `spendButtonLabel`: (Default: *"+ Spend / Bill"*)
  - `handoverButtonLabel`: (Default: *"Handover Cash"*)
  - `targetGoalAmount`: (Default: *200000*)

### B. Persistent Database Storage (`src/lib/db.ts`)
- Add `settings` key to `db.json` with fallback default values.
- Expose `getSettings()` and `updateSettings()` helper functions.

### C. API Endpoint (`/api/admin/settings`)
- **`GET /api/admin/settings`**: Public fetch for active branding & label settings.
- **`POST /api/admin/settings`**: Restricted to `SUPER_ADMIN`. Saves updated logo, labels, target goal, and primary theme.

### D. Super Admin UI Tab & Real-Time Preview
- Add a new **"Branding & Labels"** card under the Super Admin Tab in `src/app/page.tsx`.
- Include an image upload preview for custom logos.
- Color theme picker with instant client-side preview.

---

## 3. Development Workflow (Git Branch Strategy)
1. Branch out: `git checkout -b feature/admin-customization-branding`
2. Implement backend DB & API route changes.
3. Implement dynamic frontend theme & custom label binding in components.
4. Test on local dev environment (`npm run dev` & `npm run build`).
5. Merge into `main` branch.
6. Push to GitHub (`origin/main`) for Vercel auto-deployment.
7. Clean up local & remote feature branch (`git branch -d` / `git push origin --delete`).
