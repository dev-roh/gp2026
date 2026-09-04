# GitHub & Vercel First Deployment Guide for dev-roh/gp2026

Follow these steps to finish setting up the remote GitHub repository and launch your first deployment:

---

## Step 1: Create GitHub Remote Repository
1. Log into your GitHub account: **`dev-roh`**.
2. Click **+** (top right) > **New repository**.
3. **Repository name**: `gp2026`
4. Visibility: **Public** or **Private** (as preferred).
5. Leave "Add a README", ".gitignore", and "License" UNCHECKED (since we already created them locally).
6. Click **Create repository**.

---

## Step 2: Push Code to GitHub
In your local terminal, run the following command to push code to your new repo:
```bash
git push -u origin main
```

---

## Step 3: Get Vercel Project Secrets & Token

To allow GitHub Actions to build and deploy to Vercel on every push, grab these 3 secrets:

### 1. `VERCEL_TOKEN`
- Go to [Vercel Account Tokens](https://vercel.com/account/tokens).
- Click **Create Token** > Name: `GitHub Actions Token` > Select Scope & Expiration > Click **Create**.
- Copy the token value.

### 2. `VERCEL_ORG_ID` & `VERCEL_PROJECT_ID`
- Link your project locally or via Vercel Dashboard:
  Run `npx vercel link` in your project folder.
- This creates a `.vercel/project.json` containing:
  - `orgId` -> `VERCEL_ORG_ID`
  - `projectId` -> `VERCEL_PROJECT_ID`

---

## Step 4: Save Secrets in GitHub Repository

1. Open your GitHub repo: `https://github.com/dev-roh/gp2026`.
2. Go to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret** and add:
   - Name: `VERCEL_TOKEN` | Value: *(Your Vercel Token)*
   - Name: `VERCEL_ORG_ID` | Value: *(Your Vercel Org ID)*
   - Name: `VERCEL_PROJECT_ID` | Value: *(Your Vercel Project ID)*

---

## Step 5: Configure Application Environment Variables in Vercel

In Vercel Dashboard > **Settings** > **Environment Variables**, add:
- `NEXTAUTH_URL` = `https://gp2026.luhurachati.com`
- `NEXTAUTH_SECRET` = *(Your 32-character secret)*
- `GOOGLE_CLIENT_ID` = *(Your Google OAuth Client ID)*
- `GOOGLE_CLIENT_SECRET` = *(Your Google OAuth Client Secret)*

Once completed, any `git push` to `main` will automatically trigger GitHub Actions to build and publish your app live to `https://gp2026.luhurachati.com`!
