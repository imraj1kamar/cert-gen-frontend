// app/api/users/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

// Helper to verify admin/auth from cookie token
async function verifyAuth(request) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload;
  } catch (err) {
    return null;
  }
}

// GET: /api/users (Fetch all users)
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      orderBy: { id: 'desc' },
    });

    // Hide password field for security
    const sanitizedUsers = users.map(({ password: _, ...user }) => user);

    return NextResponse.json({ success: true, data: sanitizedUsers }, { status: 200 });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: /api/users (Add a new user)
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, password, role, displayName, status } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Username and password are required." }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Username already exists." }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || "user",
        name: displayName || username, // <--- YAHAN CHANGE KIYA HAI (displayName se 'name' kar diya)
        status: status !== undefined ? Number(status) : 1, // 1 for Active, 0 for Inactive
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ success: true, message: "User created successfully!", data: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error("Add User Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}