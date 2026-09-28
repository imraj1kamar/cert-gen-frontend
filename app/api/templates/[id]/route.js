// app/api/templates/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import fs from 'fs/promises';
import path from 'path';

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

// PUT: Update a template's mapping data
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const templateId = Number(id);
    const body = await request.json();
    
    if (!body.mappingData) {
       return NextResponse.json({ success: false, message: "Mapping data is required" }, { status: 400 });
    }

    const updatedTemplate = await prisma.template.update({
      where: { id: templateId },
      data: {
        mappingData: body.mappingData,
        updatedBy: auth.username || 'admin',
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ success: true, message: "Template mapping updated!", data: updatedTemplate }, { status: 200 });
  } catch (error) {
    console.error("Update Template Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete a template by ID
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const templateId = Number(id);

    // 1. Pehle database se template ka data nikalenge taaki PDF file delete kar sakein
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ success: false, message: "Template not found" }, { status: 404 });
    }

    // 2. System se actual PDF file delete karna (using pdfUrl field)
    if (template.pdfUrl) {
      const filePath = path.join(process.cwd(), 'public', template.pdfUrl);
      try {
        await fs.unlink(filePath); // PDF file server se delete kar dega
      } catch (fileError) {
        console.warn("File could not be deleted from system (might be missing):", fileError);
      }
    }

    // 3. Database se record delete karna
    await prisma.template.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ success: true, message: "Template deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Delete Template Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}