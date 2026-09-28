// app/api/signatories/[id]/route.js
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

// PUT: Update an existing signatory by ID
export async function PUT(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const signatoryId = Number(id);

    // Pehle existing record check karein
    const existingSignatory = await prisma.signatory.findUnique({
      where: { id: signatoryId },
    });

    if (!existingSignatory) {
      return NextResponse.json({ success: false, message: "Signatory not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get('name');
    const designation = formData.get('designation');
    const file = formData.get('file'); // Naya image aayega toh yahan milega
    const status = formData.get('status');

    let updateData = {
      updatedBy: auth.username || 'admin',
    };

    if (name) updateData.name = name;
    if (designation !== null) updateData.designation = designation;
    if (status !== null) updateData.status = Number(status);

    // Agar naya signature file upload hua hai
    if (file && file !== 'null' && file !== 'undefined') {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name.replaceAll(" ", "_");
      const filename = `${Date.now()}_${originalName}`;
      
      const uploadDir = path.join(process.cwd(), 'public/uploads/signatures');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      // Naya URL data mein add karein
      updateData.signatureUrl = `/uploads/signatures/${filename}`;

      // Purana image server se delete karein taaki storage bache
      if (existingSignatory.signatureUrl) {
        const oldFilePath = path.join(process.cwd(), 'public', existingSignatory.signatureUrl);
        try {
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.warn("Old signature file could not be deleted:", err);
        }
      }
    }

    // Database mein update karein
    const updatedSignatory = await prisma.signatory.update({
      where: { id: signatoryId },
      data: updateData,
    });

    return NextResponse.json(
      { success: true, message: "Signatory updated successfully!", data: updatedSignatory }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Signatory Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// DELETE: Delete a signatory by ID
export async function DELETE(request, { params }) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const signatoryId = Number(id);

    const signatory = await prisma.signatory.findUnique({
      where: { id: signatoryId },
    });

    if (!signatory) {
      return NextResponse.json({ success: false, message: "Signatory not found" }, { status: 404 });
    }

    if (signatory.signatureUrl) {
      const filePath = path.join(process.cwd(), 'public', signatory.signatureUrl);
      try {
        await fs.unlink(filePath); 
      } catch (fileError) {
        console.warn("Signature file could not be deleted from system:", fileError);
      }
    }

    await prisma.signatory.delete({
      where: { id: signatoryId },
    });

    return NextResponse.json({ success: true, message: "Signatory deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Delete Signatory Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}