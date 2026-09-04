import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || 'ganesh_puja_2026_super_secret_local_key' 
  });

  const { pathname } = req.nextUrl;

  // Allow public landing page, NextAuth callbacks, static assets, and manifest files
  if (
    pathname === '/' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/manifest.json') ||
    pathname.includes('/icon-')
  ) {
    return NextResponse.next();
  }

  // If user is NOT authenticated trying to access protected API, return 401
  if (!token && pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
