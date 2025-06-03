import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Create the response
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    );
    
    // Clear the auth cookie
    response.cookies.delete('client-crm-auth');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { message: 'Logout failed' },
      { status: 500 }
    );
  }
}
