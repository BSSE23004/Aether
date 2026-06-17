import { NextRequest } from 'next/server';
import { useAuthContext } from '../providers/AuthProvider';

export function middleware(req: NextRequest) {
  const isAuthenticated = useAuthContext().isAuthenticated;

  if (!isAuthenticated && req.nextUrl.pathname !== '/api/auth/login') {
    return new Response(JSON.stringify({ message: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return NextResponse.next();
}