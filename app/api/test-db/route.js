import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ⭐️ Yeh line BigInt serialization error ko fix kar degi
BigInt.prototype.toJSON = function () {
  return Number(this);
};

export async function GET() {
  try {
    // Database connection check karne ke liye raw query
    const result = await prisma.$queryRaw`SELECT 1 + 1 AS connection_test`;

    return NextResponse.json({
      success: true,
      message: "Database connected successfully with MySQL (`cert_gen_db`)!",
      data: result,
    }, { status: 200 });

  } catch (error) {
    console.error("Database connection failed:", error);
    return NextResponse.json({
      success: false,
      message: "Database connection failed!",
      error: error.message,
    }, { status: 500 });
  }
}