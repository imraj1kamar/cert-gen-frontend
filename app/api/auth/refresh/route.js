// app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT, jwtVerify } from 'jose';

const getSecretKey = (isRefresh = false) => {
  const name = isRefresh ? 'REFRESH_TOKEN_SECRET' : 'JWT_SECRET';
  const secret = process.env[name];
  if (!secret) throw new Error(`${name} is not set`);
  return new TextEncoder().encode(secret);
};

const unauthorized = (message) =>
  NextResponse.json({ success: false, message }, { status: 401 });

export async function POST(request) {
  try {
    // 1. Refresh token cookie se lo
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (!refreshToken) return unauthorized('No refresh token.');

    // 2. Refresh secret se verify karo
    const { payload } = await jwtVerify(refreshToken, getSecretKey(true));
    const userId = Number(payload.id);
    if (!Number.isInteger(userId)) return unauthorized('Invalid token.');

    // 3. User ki latest details DB se lo
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || Number(user.status) !== 1) {
      return unauthorized('User not found or inactive.');
    }

    // 4. Naya access token (15 min)
    const accessToken = await new SignJWT({
      id: String(user.id),
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(getSecretKey(false));

    const response = NextResponse.json(
      { success: true, message: 'Token refreshed.' },
      { status: 200 }
    );

    response.cookies.set({
      name: 'accessToken',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Refresh Error:', error);
    return unauthorized('Invalid or expired refresh token.');
  }
}