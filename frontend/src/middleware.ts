// Middleware for route protection
// Note: Since we're using localStorage for tokens, authentication is handled client-side
// This middleware is kept for future server-side authentication if needed

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For now, allow all routes - authentication handled client-side
  // Can be enhanced later for server-side token validation
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

