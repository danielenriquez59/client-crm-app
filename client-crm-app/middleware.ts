import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the auth cookie name
const AUTH_COOKIE = 'client-crm-auth';

// Function to verify the token
function verifyToken(token: string): boolean {
  try {
    // Safely decode the base64 token without using Buffer
    // This is more compatible with edge runtime environments
    const base64Decoded = atob(token);
    const payload = JSON.parse(base64Decoded);
    
    // Check if the token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    return payload.isAuthenticated === true;
  } catch (error) {
    return false;
  }
}

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Check if the path is excluded from authentication
  const isPublicPath = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.includes('/favicon.ico');
  
  // Get the authentication cookie
  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = authCookie ? verifyToken(authCookie) : false;
  
  // Redirect to login if accessing a protected route without authentication
  if (!isPublicPath && !isAuthenticated) {
    // Store the original URL to redirect back after login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?callbackUrl=${encodeURIComponent(request.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }
  
  // Redirect to home if accessing login while already authenticated
  if (pathname === '/login' && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
