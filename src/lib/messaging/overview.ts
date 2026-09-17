import 'server-only';
import { getDb, now } from './db';

export function consoleOverview() {
  const db = getDb();
  const count = (sql: string, ...params: unknown[]) => (db.prepare(sql).get(...params) as { n: number }).n;
  const dayAgo = now() - 24 * 60 * 60 * 1000;
  return {
    workspaces: count('SELECT COUNT(*) AS n FROM workspaces'),
    activeConnections: count(`SELECT COUNT(*) AS n FROM connections WHERE status = 'active'`),
    inbound24h: count(`SELECT COUNT(*) AS n FROM messages WHERE direction = 'inbound' AND created_at > ?`, dayAgo),
    pendingDeliveries: count(`SELECT COUNT(*) AS n FROM deliveries WHERE status = 'pending'`),
    deadDeliveries: count(`SELECT COUNT(*) AS n FROM deliveries WHERE status = 'dead'`),
    failedEvents: count(`SELECT COUNT(*) AS n FROM webhook_events WHERE status = 'failed'`),
    lastEventAt: (db.prepare('SELECT MAX(received_at) AS t FROM webhook_events').get() as { t: number | null }).t,
    attention: db.prepare(`
      SELECT c.id, c.workspace_id, c.page_name, c.status_detail, w.name AS workspace_name
      FROM connections c JOIN workspaces w ON w.id = c.workspace_id
      WHERE c.status = 'reconnect_needed' ORDER BY c.updated_at DESC
    `).all() as { id: number; workspace_id: number; page_name: string; status_detail: string | null; workspace_name: string }[],
  };
}
