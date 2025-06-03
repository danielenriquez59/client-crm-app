import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define the auth cookie name
const AUTH_COOKIE = 'client-crm-auth';

// Debug mode - set to true to bypass authentication (for troubleshooting)
const DEBUG_BYPASS_AUTH = false;

// Safely decode base64 with fallback
function safeAtob(input: string): string {
  try {
    return atob(input);
  } catch (e) {
    // Fallback implementation if atob is not available
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    input = input.replace(/=+$/, '');
    
    for (let bc = 0, bs = 0, buffer, i = 0; buffer = input.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
      buffer = chars.indexOf(buffer);
    }
    
    return output;
  }
}

// Function to verify the token
function verifyToken(token: string): boolean {
  try {
    // Safely decode the base64 token
    const base64Decoded = safeAtob(token);
    const payload = JSON.parse(base64Decoded);
    
    // Check if the token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
    
    return payload.isAuthenticated === true;
  } catch (error) {
    // Silent fail and return false
    return false;
  }
}

export function middleware(request: NextRequest) {
  try {
    // If debug bypass is enabled, skip authentication checks
    if (DEBUG_BYPASS_AUTH) {
      return NextResponse.next();
    }
    
    // Get the pathname of the request
    const { pathname } = request.nextUrl;
    
    // Check if the path is excluded from authentication
    const isPublicPath = 
      pathname.startsWith('/login') || 
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_next') ||
      pathname.includes('/favicon') ||
      pathname.includes('.ico') ||
      pathname.includes('.png') ||
      pathname.includes('.jpg') ||
      pathname.includes('.svg');
    
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
  } catch (error) {
    // If any error occurs in the middleware, log it and continue
    console.error('Middleware error:', error);
    
    // Allow the request to continue to avoid breaking the application
    return NextResponse.next();
  }
}

// Configure which paths the middleware will run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public files (images, icons, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.png|.*\.jpg|.*\.svg).*)',
  ],
};
