// app/api/auth/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Response tayar karein
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully!",
      },
      { status: 200 }
    );

    // 2. Access Token cookie ko expire/clear kar dein
    response.cookies.set({
      name: 'accessToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Turant expire kar dega
      path: '/',
    });

    // 3. Refresh Token cookie ko bhi expire/clear kar dein
    response.cookies.set({
      name: 'refreshToken',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0, // Turant expire kar dega
      path: '/',
    });

    return response;

  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}