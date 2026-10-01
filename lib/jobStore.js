// lib/jobStore.js
// In-memory job store for tracking certificate generation progress.
//
// ⚠️  IMPORTANT — Why globalThis?
//   Next.js Turbopack runs each API route in its own module scope (worker).
//   A plain `const jobs = new Map()` produces a DIFFERENT Map instance per
//   worker, so /api/generate writes to one Map and /api/generate/progress
//   reads from an empty different Map — causing the "0 rows in UI" bug.
//   Anchoring to globalThis gives every worker in the same Node.js process
//   access to the exact same Map object.

if (!globalThis.__certJobStore) {
  globalThis.__certJobStore = new Map();
}
const jobs = globalThis.__certJobStore; // shared across all Next.js workers

export function createJob(jobId, total, archiveUrl = null) {
  jobs.set(jobId, {
    status: 'running',
    progress: 0,
    total,
    successCount: 0,
    errorCount: 0,
    logs: [],       // array of log event objects
    errors: [],     // failed row details
    done: false,
    isCancelled: false, // ← Panic Stop flag
    archiveUrl,     // uploaded Excel file path
    createdAt: Date.now(),
  });
}

export function pushLog(jobId, event) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.logs.push({ ...event, ts: Date.now() });
  // Keep last 5000 logs max
  if (job.logs.length > 5000) job.logs.splice(0, job.logs.length - 5000);
}

export function updateProgress(jobId, { successCount, errorCount, progress }) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.successCount = successCount;
  job.errorCount = errorCount;
  job.progress = progress;
}

export function failRow(jobId, rowDetail) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.errors.push(rowDetail);
}

export function completeJob(jobId, status = 'done') {
  const job = jobs.get(jobId);
  if (!job) return;
  job.done = true;
  job.status = status;
  job.progress = status === 'done' ? 100 : job.progress;
  // Auto cleanup after 10 minutes
  setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000);
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

// Panic Stop: loop ke next iteration check mein job ruk jaayegi
export function cancelJob(jobId) {
  const job = jobs.get(jobId);
  if (!job || job.done) return false;
  job.isCancelled = true;
  job.done = true;
  job.status = 'cancelled';
  // Auto cleanup after 10 minutes
  setTimeout(() => jobs.delete(jobId), 10 * 60 * 1000);
  return true;
}
