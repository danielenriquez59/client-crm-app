import { NextRequest, NextResponse } from 'next/server';
import { validatePassword, createAuthToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { password } = body;
    
    // Validate the password
    if (!password) {
      return NextResponse.json(
        { message: 'Password is required' },
        { status: 400 }
      );
    }
    
    // Check if the password matches the environment variable
    const isValid = validatePassword(password);
    
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Create a JWT token
    const token = await createAuthToken();
    
    // Create the response
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
    // Set the cookie with HttpOnly and Secure flags
    response.cookies.set({
      name: 'client-crm-auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
      sameSite: 'strict',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 500 }
    );
  }
}
