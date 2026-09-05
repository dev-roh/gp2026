import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import jwt from 'jsonwebtoken';
import { getUserRole, registerOrUpdateUserAsync } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
    CredentialsProvider({
      id: 'sso-gateway',
      name: 'Central SSO Gateway',
      credentials: {
        token: { label: 'SSO Token', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.token) return null;
        try {
          const secret = process.env.SSO_GATEWAY_SECRET || process.env.NEXTAUTH_SECRET || "@@Secure@@sso@secret123";
          const decoded = jwt.verify(credentials.token, secret) as any;

          if (decoded && decoded.email) {
            // Synchronize user in local database/storage
            await registerOrUpdateUserAsync(
              decoded.name || decoded.email.split("@")[0],
              decoded.email,
              decoded.picture
            );

            return {
              id: decoded.sub || decoded.email,
              name: decoded.name || decoded.email.split("@")[0],
              email: decoded.email,
              image: decoded.picture,
            };
          }
        } catch (error) {
          console.error("Failed to verify Central SSO Token:", error);
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.email && user?.name) {
        await registerOrUpdateUserAsync(user.name, user.email, user.image || undefined);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (token?.email) {
        token.role = getUserRole(token.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).role = token.role || getUserRole(session.user.email);
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl || parsedUrl.origin === "https://www.luhurachati.com" || parsedUrl.origin === "https://luhurachati.com") {
          return url;
        }
      } catch (e) {
        // invalid url, fallback to baseUrl
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'ganesh_puja_2026_super_secret_local_key',
};
