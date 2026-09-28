import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

// Timing attack se bachne ke liye dummy hash
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

const getSecretKey = (isRefresh = false) => {
  const secret = isRefresh
    ? process.env.REFRESH_TOKEN_SECRET
    : process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(`${isRefresh ? 'REFRESH_TOKEN_SECRET' : 'JWT_SECRET'} is not set`);
  }
  return new TextEncoder().encode(secret);
};

// BigInt ko safely serialize karne ke liye (global patch ki jagah)
const serialize = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

const invalid = () =>
  NextResponse.json(
    { success: false, message: 'Invalid username or password.' },
    { status: 401 }
  );

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    // 1. Validation + type check
    if (
      typeof username !== 'string' || typeof password !== 'string' ||
      !username.trim() || !password
    ) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // 2. Find user
    const user = await prisma.user.findFirst({
      where: { username: username.trim() },
    });

    // 3. Password verify (user na mile tab bhi compare chalao)
    const stored = user?.password ?? '';
    const isHashed = stored.startsWith('$2');
    let isPasswordValid = false;

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
    } else if (isHashed) {
      isPasswordValid = await bcrypt.compare(password, stored);
    } else {
      // Purane plain-text users: match hone par turant hash me migrate karo
      isPasswordValid = stored === password;
      if (isPasswordValid) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: await bcrypt.hash(password, 12) },
        });
      }
    }

    if (!user || !isPasswordValid) return invalid();

    // 4. Status check (BigInt-safe). Password sahi hone ke baad check karo
    if (Number(user.status) !== 1) {
      return NextResponse.json(
        { success: false, message: 'Your account is inactive or blocked.' },
        { status: 403 }
      );
    }

    // 5. Tokens
    const accessToken = await new SignJWT({
      id: String(user.id),
      username: user.username,
      role: user.role,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(getSecretKey(false));

    const refreshToken = await new SignJWT({ id: String(user.id) })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(getSecretKey(true));

    // 6. Password hatao aur response banao
    const { password: _, ...userData } = user;
    const response = NextResponse.json(
      { success: true, message: 'Login successful!', data: serialize(userData) },
      { status: 200 }
    );

    const base = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };

    response.cookies.set({ ...base, name: 'accessToken', value: accessToken, maxAge: 15 * 60, path: '/' });
    response.cookies.set({ ...base, name: 'refreshToken', value: refreshToken, maxAge: 7 * 24 * 60 * 60, path: '/api/auth/refresh' });

    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}