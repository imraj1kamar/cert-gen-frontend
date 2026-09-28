// app/api/signatories/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import fs from 'fs/promises';
import path from 'path';

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

// GET: Fetch all signatories
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const signatories = await prisma.signatory.findMany({
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ success: true, data: signatories }, { status: 200 });
  } catch (error) {
    console.error("Fetch Signatories Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Add a new signatory (Handles multipart/form-data)
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // FormData read karna
    const formData = await request.formData();
    
    // Exact database fields ke hisaab se data nikalna
    const name = formData.get('name');
    const designation = formData.get('designation');
    const file = formData.get('file'); // Image file
    const status = formData.get('status');

    if (!name || !file) {
      return NextResponse.json(
        { success: false, message: "Signatory Name and Signature File are required." }, 
        { status: 400 }
      );
    }

    // 1. File processing and Saving
    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name.replaceAll(" ", "_");
    const filename = `${Date.now()}_${originalName}`;
    
    // Public folder ke andar directory setup
    const uploadDir = path.join(process.cwd(), 'public/uploads/signatures');
    await fs.mkdir(uploadDir, { recursive: true });

    // File ko system mein save karna
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Database mein save karne ke liye image ka relative URL
    const signatureUrl = `/uploads/signatures/${filename}`;

    // 2. Database (Prisma) mein save karna
    const newSignatory = await prisma.signatory.create({
      data: {
        name: name,
        designation: designation || "", // Agar khali aaye toh blank string
        signatureUrl: signatureUrl,     // Aapke DB ka field name
        status: status !== null ? Number(status) : 1,
        createdBy: auth.username || 'admin',
        // createdAt Prisma default(now()) se sambhal lega
        // updatedAt agar required error de, toh schema mein 'updatedAt DateTime?' zaroor kar dein
      },
    });

    return NextResponse.json(
      { success: true, message: "Signatory added successfully!", data: newSignatory }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Add Signatory Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}