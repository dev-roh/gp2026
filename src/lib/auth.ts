import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getUserRole, registerOrUpdateUserAsync } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
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
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'ganesh_puja_2026_super_secret_local_key',
};
