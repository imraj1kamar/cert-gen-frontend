// app/api/generate/cancel/route.js
// POST /api/generate/cancel  { jobId }
// Panic Stop: jobStore mein isCancelled flag set karta hai.
// Generate loop har iteration ke baad ye flag check karta hai aur ruk jaata hai.

import { NextResponse } from 'next/server';
import { cancelJob, getJob } from '@/lib/jobStore';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ success: false, message: 'jobId required' }, { status: 400 });
    }

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    if (job.done && job.status !== 'cancelled') {
      return NextResponse.json({ success: false, message: 'Job already completed' }, { status: 409 });
    }

    const cancelled = cancelJob(jobId);
    console.log(`[PANIC STOP] Job ${jobId} cancel request → ${cancelled ? 'success' : 'already done'}`);

    // DB mein cancelled log likhna
    if (cancelled) {
      try {
        const updatedJob = getJob(jobId);
        await prisma.log.create({
          data: {
            action: 'BATCH_GENERATE_CANCELLED',
            user: 'System Admin', // future: req se user nikalo
            details: `Batch generation cancelled by user via Panic Stop. ${updatedJob?.successCount ?? 0} PDFs generated before stop.`,
            status: 2, // 2 = cancelled
            createdBy: 'panic_stop',
            totalRecords: updatedJob?.total ?? 0,
            successCount: updatedJob?.successCount ?? 0,
            errorCount: updatedJob?.errorCount ?? 0,
            skipCount: 0,
            archiveUrl: updatedJob?.archiveUrl ?? null,
          },
        });
      } catch (dbErr) {
        console.warn('[PANIC STOP] DB log write failed:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Job cancellation requested' });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
