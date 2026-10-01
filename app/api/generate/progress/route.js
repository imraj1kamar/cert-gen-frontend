// app/api/generate/progress/route.js
// SSE endpoint — GET /api/generate/progress?jobId=xxx
// Streams real-time progress events from the jobStore to the browser.

import { getJob } from '@/lib/jobStore';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return new Response('Missing jobId', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {
          // client disconnected
        }
      };

      // Send initial ping
      send({ type: 'connected', jobId });

      let lastLogIndex = 0;
      let done = false;

      const poll = async () => {
        const job = getJob(jobId);

        if (!job) {
          // Job not found yet – wait for it to be created
          return;
        }

        // Send any new logs since last poll
        const newLogs = job.logs.slice(lastLogIndex);
        for (const logEvent of newLogs) {
          send(logEvent);
        }
        lastLogIndex += newLogs.length;

        // Send progress snapshot
        send({
          type: 'progress',
          progress: job.progress,
          successCount: job.successCount,
          errorCount: job.errorCount,
          total: job.total,
          errors: job.errors,
        });

        if (job.done) {
          // ⚠️  done = true PEHLE set karo, controller.close() ke BAAD nahi.
          // Agar client pehle se disconnect ho gaya hai (Panic Stop / es.close()),
          // controller already closed hoga. done flag setInterval ko turant rokta hai.
          done = true;
          clearInterval(interval);

          const finalType = job.status === 'done'
            ? 'complete'
            : job.status === 'cancelled'
            ? 'cancelled'
            : 'error_complete';
          send({ type: finalType, progress: job.progress, successCount: job.successCount, errorCount: job.errorCount, total: job.total, errors: job.errors });

          try {
            controller.close();
          } catch (_) {
            // Client ne pehle hi connection close kar diya — safe to ignore
          }
        }
      };

      // Poll every 300ms
      const interval = setInterval(async () => {
        if (done) {
          clearInterval(interval);
          return;
        }
        await poll();
      }, 300);

      // Stop after 10 minutes max
      setTimeout(() => {
        if (!done) {
          done = true;
          clearInterval(interval);
          send({ type: 'timeout', msg: 'SSE connection timed out after 10 minutes' });
          try { controller.close(); } catch (_) { /* already closed */ }
        }
      }, 10 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
