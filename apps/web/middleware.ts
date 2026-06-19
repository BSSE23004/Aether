import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected and public routes
const protectedRoutes = ['/dashboard'];
const publicRoutes = ['/auth/connect', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for the auth token cookie we set in the frontend SIWE flow
    const token = request.cookies.get('aether_token')?.value;

    if (!token) {
      // Redirect to connect page if no token is present
      const url = new URL('/auth/connect', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
  }

  // Check if trying to access auth pages while already logged in
  if (pathname.startsWith('/auth/connect')) {
    const token = request.cookies.get('aether_token')?.value;
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
