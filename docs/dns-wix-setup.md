# Wix DNS Setup Guide for gp2026.luhurachati.com

Follow these exact steps in your **Wix Account** to connect your domain `luhurachati.com` to the Vercel deployment:

---

## Step-by-Step Instructions

1. Log into your **Wix Dashboard** at [wix.com](https://www.wix.com).
2. Go to **Domains** page (Settings > Domains, or Account Manager > Domains).
3. Click the **3 dots (...)** next to `luhurachati.com` and select **Manage DNS Records**.
4. Scroll down to the **CNAME (Aliases)** section.
5. Click **+ Add Record**.
6. Fill in the fields exactly as follows:
   - **Host Name / Subdomain**: `gp2026`
   - **Value / Points to**: `cname.vercel-dns.com`
   - **TTL**: `1 Hour` (or Default)
7. Click **Save**.

---

## Step 2: Add Subdomain in Vercel Dashboard

1. Open your project in the **Vercel Dashboard**.
2. Go to **Settings** > **Domains**.
3. Type `gp2026.luhurachati.com` into the input box and click **Add**.
4. Vercel will automatically verify the CNAME record from Wix and provision a **free SSL Certificate** within 2–5 minutes.

---

## Step 3: Add Vercel Environment Variables (OAuth Secrets)

In your Vercel Project > **Settings** > **Environment Variables**, add the following keys safely (never hardcoded in code):

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NEXTAUTH_URL` | `https://gp2026.luhurachati.com` | Production URL |
| `NEXTAUTH_SECRET` | `a3f9e8...` | Generate random secret string |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Google OAuth Client Secret |
| `ADMIN_EMAILS` | `your-email@luhurachati.com` | Admins authorized for full control |
