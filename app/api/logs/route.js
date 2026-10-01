// app/api/logs/route.js
// GET  /api/logs        → saare batch generation logs DB se fetch karo
// POST /api/logs        → naya log entry DB mein save karo (generate route call karta hai)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ─── GET: Fetch all logs ───────────────────────────────────────────────────
export async function GET(request) {
  try {
    const logs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200, // latest 200 records
    });

    // Frontend ke liye normalize karo
    const formatted = logs.map((l) => ({
      id: l.id,
      action: l.action,
      performedBy: l.user,
      userRole: l.createdBy || 'system',
      status: l.status === 1 ? 'SUCCESS' : l.status === 2 ? 'CANCELLED' : 'ERROR',
      description: l.details || '',
      totalRecords: l.totalRecords,
      successCount: l.successCount,
      errorCount: l.errorCount,
      skipCount: l.skipCount,
      archiveUrl: l.archiveUrl || null,
      executionDetails: l.executionDetails,
      timestamp: new Date(l.timestamp).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true,
      }),
      ipAddress: '—', // future: request IP
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error('[GET /api/logs] Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// ─── POST: Write a new log entry ───────────────────────────────────────────
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      action,
      user = 'System',
      details = '',
      status = 1,           // 1=success, 0=error, 2=cancelled
      createdBy = 'system',
      totalRecords = 0,
      successCount = 0,
      skipCount = 0,
      errorCount = 0,
      executionDetails = null,
      archiveUrl = null,
    } = body;

    if (!action) {
      return NextResponse.json({ success: false, message: 'action is required' }, { status: 400 });
    }

    const log = await prisma.log.create({
      data: {
        action,
        user,
        details,
        status,
        createdBy,
        totalRecords,
        successCount,
        skipCount,
        errorCount,
        executionDetails,
        archiveUrl,
      },
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/logs] Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
