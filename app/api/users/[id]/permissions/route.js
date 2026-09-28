// app/api/users/[id]/permissions/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

BigInt.prototype.toJSON = function () {
  return Number(this);
};

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret');

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

// PUT: /api/users/[id]/permissions (Update user permissions/status/role)
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number(id);
    const body = await request.json();

    // 💡 SMART PERMISSION EXTRACTOR:
    // Handle both { permissions: {...} } and direct { can_generate_pdf: true, ... } payloads
    let permissionsData = body.permissions;
    
    if (!permissionsData) {
      // Agar 'permissions' key nahi hai, toh role, status, aur name ko chhod kar bachi hui cheezon ko permissions maan lo
      const { role, status, name, displayName, ...rest } = body;
      if (Object.keys(rest).length > 0) {
        permissionsData = rest;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.role && { role: body.role }),
        ...(body.status !== undefined && { status: Number(body.status) }),
        ...(body.name && { name: body.name }),
        ...(body.displayName && { name: body.displayName }), // Handle frontend displayName mapping
        ...(permissionsData && { permissions: permissionsData }), // Nayi permissions set karein
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(
      { 
        success: true, 
        message: "Permissions updated successfully!", 
        data: userWithoutPassword 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Permissions Error:", error);
    return NextResponse.json(
      { success: false, message: error.message }, 
      { status: 500 }
    );
  }
}

// DELETE: /api/users/[id] (Delete user)
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = Number(id);

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: "User deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Delete User Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}