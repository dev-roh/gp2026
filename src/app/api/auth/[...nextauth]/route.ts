import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        // Default role assignment based on admin email list or standard user
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
        (session.user as any).role = adminEmails.includes(session.user.email || '') 
          ? 'ADMIN' 
          : 'MEMBER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET || 'ganesh_puja_2026_super_secret_local_key',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
