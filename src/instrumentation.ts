export async function register() {
  // The worker uses better-sqlite3 and timers, so it only runs in the Node.js server runtime.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.MESSAGING_WORKER !== 'off') {
    const { startWorker } = await import('@/lib/messaging/worker');
    startWorker();
  }
}
