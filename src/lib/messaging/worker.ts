import 'server-only';
import { getDb, now } from './db';
import { env } from './env';
import { processDueEvents } from './processor';
import { deliverDue } from './deliveries';
import { errorSummary, log } from '@/lib/log';

/**
 * In-process background worker, started once from instrumentation.ts.
 * All state lives in SQLite, so a restart loses nothing: rows locked by a
 * process that died are picked up again once their lock expires.
 */

const TICK_MS = 2_000;
const RETENTION_EVERY_MS = 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const state = globalThis as unknown as { __oyWorker?: { timer: NodeJS.Timeout; running: boolean; lastRetention: number } };

async function tick() {
  const worker = state.__oyWorker;
  if (!worker || worker.running) return;
  worker.running = true;
  try {
    // Drain in rounds so a burst doesn't wait for the next interval.
    for (let round = 0; round < 5; round++) {
      const handled = (await processDueEvents()) + (await deliverDue());
      if (handled === 0) break;
    }
    if (now() - worker.lastRetention > RETENTION_EVERY_MS) {
      worker.lastRetention = now();
      purgeExpiredData();
    }
  } catch (err) {
    log.error('worker.tick.failed', { error: errorSummary(err) });
  } finally {
    worker.running = false;
  }
}

export function startWorker() {
  if (state.__oyWorker) return;
  state.__oyWorker = { timer: setInterval(tick, TICK_MS), running: false, lastRetention: 0 };
  state.__oyWorker.timer.unref?.();
  log.info('worker.started');
}

/** Ask the worker to run now (e.g. right after a webhook arrives). */
export function kickWorker() {
  if (state.__oyWorker) setImmediate(tick);
}

/** Retention rules published in /privacy. */
export function purgeExpiredData(nowMs: number = now()) {
  const db = getDb();
  const retentionMs = env.messageRetentionDays() * DAY;
  const result = db.transaction(() => ({
    messages:      db.prepare('DELETE FROM messages WHERE created_at < ?').run(nowMs - retentionMs).changes,
    conversations: db.prepare('DELETE FROM conversations WHERE last_message_at < ? AND NOT EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = conversations.id)').run(nowMs - retentionMs).changes,
    events:        db.prepare('DELETE FROM webhook_events WHERE received_at < ?').run(nowMs - 14 * DAY).changes,
    deliveries:    db.prepare(`DELETE FROM deliveries WHERE created_at < ? AND status != 'pending'`).run(nowMs - 30 * DAY).changes,
    oauth:         db.prepare('DELETE FROM oauth_sessions WHERE expires_at < ?').run(nowMs).changes,
    links:         db.prepare('DELETE FROM connect_links WHERE expires_at < ?').run(nowMs - 30 * DAY).changes,
    sessions:      db.prepare('DELETE FROM staff_sessions WHERE expires_at < ?').run(nowMs).changes,
    deletions:     db.prepare('DELETE FROM deletion_requests WHERE created_at < ?').run(nowMs - 365 * DAY).changes,
  }))();
  log.info('retention.purged', result);
  return result;
}
