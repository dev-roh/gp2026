# Google OAuth 2.0 Credentials Setup Guide

Follow these steps to obtain your production Google OAuth keys for `gp2026.luhurachati.com`:

## Step 1: Open Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project named **"Ganesh Puja 2026 Finance"**.

## Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (or Internal if restricted to organization domain) and click **Create**.
3. Fill in:
   - **App name**: `GP 2026 Finance`
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
4. Under **Scopes**, add `userinfo.email` and `userinfo.profile`.

## Step 3: Create OAuth Client ID Credentials
1. Go to **APIs & Services** > **Credentials**.
2. Click **+ Create Credentials** > **OAuth client ID**.
3. Application Type: **Web application**.
4. Name: `GP 2026 Web Client`.
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local testing)
   - `https://gp2026.luhurachati.com`
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://gp2026.luhurachati.com/api/auth/callback/google`
7. Click **Create**.

## Step 4: Add Keys to Project / Vercel
1. Copy the generated **Client ID** and **Client Secret**.
2. Paste them into `.env` (for local development) or Vercel Environment Variables (for deployment):
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   NEXTAUTH_SECRET="your-32-char-random-secret"
   NEXTAUTH_URL="https://gp2026.luhurachati.com"
   ```
