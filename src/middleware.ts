import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET || 'ganesh_puja_2026_super_secret_local_key' 
  });

  const { pathname } = req.nextUrl;

  // Allow NextAuth API calls, static assets, and manifest files
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('/manifest.json') ||
    pathname.includes('/icon-')
  ) {
    return NextResponse.next();
  }

  // If user is NOT authenticated, redirect to sign-in screen
  if (!token) {
    const loginUrl = new URL('/', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    
    // Serve sign-in prompt on root page or api block
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
