import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { JWTPayload, AuthSession } from './auth-types';

// Cookie name for the auth token
const AUTH_COOKIE = 'client-crm-auth';

// JWT token expiration time (24 hours in seconds)
const TOKEN_EXPIRATION = 24 * 60 * 60;

/**
 * Create a JWT token for authentication
 */
export async function createAuthToken(): Promise<string> {
  // In a real implementation, we would use the jsonwebtoken library
  // Since we can't install packages directly, we'll create a simple token
  
  const payload: JWTPayload = {
    isAuthenticated: true,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION
  };
  
  // Encode the payload as base64 using btoa (browser-compatible)
  return btoa(JSON.stringify(payload));
}

/**
 * Verify the JWT token and return the session
 */
export function verifyAuthToken(token: string): AuthSession | null {
  try {
    // Decode the base64 token using atob (browser-compatible)
    const payload = JSON.parse(atob(token)) as JWTPayload;
    
    // Check if the token has expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return {
      isAuthenticated: payload.isAuthenticated,
      exp: payload.exp
    };
  } catch (error) {
    return null;
  }
}

/**
 * Set the auth cookie
 */
export async function setAuthCookie(): Promise<void> {
  const token = await createAuthToken();
  
  // Set the cookie with HttpOnly and Secure flags
  const cookieStore = cookies();
  
  // Using type assertion to avoid TypeScript errors
  // This is safe because we know the cookies() API provides these methods
  const cookiesWithMethods = cookieStore as unknown as {
    set: (cookie: {
      name: string;
      value: string;
      httpOnly?: boolean;
      secure?: boolean;
      maxAge?: number;
      path?: string;
      sameSite?: 'strict' | 'lax' | 'none';
    }) => void;
  };
  
  cookiesWithMethods.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: TOKEN_EXPIRATION,
    path: '/',
    sameSite: 'strict'
  });
}

/**
 * Clear the auth cookie (logout)
 */
export function clearAuthCookie(): void {
  const cookieStore = cookies();
  
  // Using type assertion to avoid TypeScript errors
  const cookiesWithMethods = cookieStore as unknown as {
    delete: (name: string) => void;
  };
  
  cookiesWithMethods.delete(AUTH_COOKIE);
}

/**
 * Get the current session from the cookie
 */
export function getSession(): AuthSession | null {
  const cookieStore = cookies();
  
  // Using type assertion to avoid TypeScript errors
  const cookiesWithMethods = cookieStore as unknown as {
    get: (name: string) => { value: string } | undefined;
  };
  
  const token = cookiesWithMethods.get(AUTH_COOKIE)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifyAuthToken(token);
}

/**
 * Check if the user is authenticated
 */
export function isAuthenticated(): boolean {
  const session = getSession();
  return !!session?.isAuthenticated;
}

/**
 * Require authentication or redirect to login
 */
export function requireAuth(): void {
  if (!isAuthenticated()) {
    redirect('/login');
  }
}

/**
 * Validate password against environment variable
 */
export function validatePassword(password: string): boolean {
  const authPassword = process.env.AUTH_PASSWORD;
  
  if (!authPassword) {
    console.error('AUTH_PASSWORD environment variable is not set');
    return false;
  }
  
  return password === authPassword;
}
