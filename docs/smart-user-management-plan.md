# Specification Blueprint: Smart User Management, Auto-Suggestions & Public Members Directory

## 1. Executive Summary & Core Objectives
This feature replaces the previous self-contribution specification. It introduces a comprehensive **Smart User Management & Directory Engine** tailored for the `SUPER_ADMIN` role while opening up a **Public Members Directory** to all logged-in members (everyone except `VIEW_ONLY` / unauthenticated guests).

---

## 2. Core User Categories & Data Model

The system aggregates and tracks users across 3 distinct sources:

1. **OAuth Logged-In Users**: Authenticated users who logged in via Google OAuth.
2. **Collection Entry Users**: Historical member entities created on-the-fly when field collectors log cash/UPI contributions (e.g., `memberName`, `memberArea`).
3. **Manually Added Users**: Members created directly by `SUPER_ADMIN` in the User Management console prior to logging in or collecting funds.

---

## 3. Key Feature Modules & Requirements

### A. Smart Backend Matching & Auto-Merging Algorithm
- **Detection Trigger**: When a new user logs in via OAuth or when a new Collection entry is created.
- **Matching Heuristics**:
  - Exact or fuzzy match on `memberName` vs `user.name`.
  - Area/Wing matching (`memberArea` vs `user.area`).
  - Optional phone number or email string match.
- **Smart Mapping Suggestions**:
  - The backend generates a **Smart Merge Suggestion** for `SUPER_ADMIN` (e.g., *"Collection entry 'Rahul Sharma' (Sector 1) matches logged-in user rahul.s@gmail.com"*).
- **Auto-Request Membership Workflow**:
  - When a matched user logs in for the first time as `VIEW_ONLY`, the system automatically submits a **Pending Membership Request** (`MEMBER` role) to the `SUPER_ADMIN` for approval.

### B. Super Admin User Management Console
- **Role Scoping**: Exclusive to `SUPER_ADMIN`.
- **Manual Mapping & Merging**:
  - `SUPER_ADMIN` can inspect unmapped collection entries and manually link/merge them to any registered or manually created user account.
  - **Restriction**: System guards prevent modifying or re-mapping existing `SUPER_ADMIN` accounts (`luhurenbaiclub@gmail.com`).
- **Role Assignment**:
  - Elevate or demote users between `VIEW_ONLY`, `MEMBER`, `COLLECTOR`, and `TREASURER`.
- **Manual User Creation**:
  - Add new members with Name, Area/Wing, Phone, and assigned Role before they register via OAuth.

### C. Public Members Directory (All Users except VIEW_ONLY)
- **Access Rule**: Visible to all authenticated users with role `MEMBER`, `COLLECTOR`, `TREASURER`, or `SUPER_ADMIN`. (Hidden from `VIEW_ONLY` and non-logged-in users).
- **Directory UI**:
  - Searchable list of all verified club members & collectors.
  - Displays Member Name, Area/Wing, Contribution status/badge, and Role tag.
  - Mobile-optimized cards with high-contrast badge indicators.

---

## 4. Implementation Plan & Deliverables

1. **Database Schema Enhancements (`src/lib/db.ts`)**:
   - Update `User` interface to track `isManual`, `linkedMemberIds`, `pendingMergeSuggestions`.
2. **Backend API Endpoints (`src/app/api/admin/users/route.ts` & `/route.ts`)**:
   - GET `/api/users`: Fetch member directory (filtered based on requester's role).
   - GET `/api/admin/users`: Fetch all accounts, collection entities, and smart suggestions for `SUPER_ADMIN`.
   - POST `/api/admin/users/merge`: Execute user merging and history re-attribution.
   - POST `/api/admin/users/approve-membership`: Handle membership requests.
3. **Frontend UI Components (`src/app/page.tsx` or `/admin/users/page.tsx`)**:
   - **User Management Tab** for Super Admin with smart suggestion banners and merge controls.
   - **Members Directory Tab** for `MEMBER`+ logged-in users.
