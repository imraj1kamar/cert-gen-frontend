// app/api/templates/route.js
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

// GET: Fetch all templates
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const templates = await prisma.template.findMany({
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ success: true, data: templates }, { status: 200 });
  } catch (error) {
    console.error("Fetch Templates Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Add a new template (Handles multipart/form-data)
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // FormData read karna (multipart/form-data)
    const formData = await request.formData();
    
    // Aapke table fields ke hisaab se data nikalna
    const category = formData.get('category');
    const templateName = formData.get('templateName');
    const file = formData.get('file'); // PDF file payload mein 'file' naam se aayegi
    const status = formData.get('status');
    const mappingDataString = formData.get('mappingData'); // JSON string from frontend

    if (!category || !templateName || !file) {
      return NextResponse.json(
        { success: false, message: "Category, Template Name, and File are required." }, 
        { status: 400 }
      );
    }

    // 1. File processing and Saving
    const buffer = Buffer.from(await file.arrayBuffer());
    // File name ke spaces ko underscore (_) se replace kar rahe hain
    const originalName = file.name.replaceAll(" ", "_");
    const filename = `${Date.now()}_${originalName}`;
    
    // Public folder ke andar uploads directory setup
    const uploadDir = path.join(process.cwd(), 'public/uploads/templates');
    await fs.mkdir(uploadDir, { recursive: true });

    // File ko system mein save karna
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // Database mein save karne ke liye PDF ka relative URL
    const pdfUrl = `/uploads/templates/${filename}`;

    // 2. Database (Prisma) mein save karna
    const newTemplate = await prisma.template.create({
      data: {
        category: category,
        templateName: templateName,
        pdfUrl: pdfUrl,
        mappingData: mappingDataString ? JSON.parse(mappingDataString) : null,
        status: status !== null ? Number(status) : 1, // Default status 1
        createdBy: auth.username || 'admin',
      },
    });

    return NextResponse.json(
      { success: true, message: "Template uploaded successfully!", data: newTemplate }, 
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload Template Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}