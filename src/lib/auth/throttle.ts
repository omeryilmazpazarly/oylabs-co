import 'server-only';

/** In-memory fixed-window failure counter (single process). */
export function createThrottle(maxFailures: number, windowMs: number) {
  const failures = new Map<string, { count: number; resetAt: number }>();
  return {
    blocked(key: string): boolean {
      const entry = failures.get(key);
      return Boolean(entry && entry.resetAt > Date.now() && entry.count >= maxFailures);
    },
    fail(key: string) {
      const entry = failures.get(key);
      if (!entry || entry.resetAt <= Date.now()) failures.set(key, { count: 1, resetAt: Date.now() + windowMs });
      else entry.count += 1;
    },
    clear(key: string) {
      failures.delete(key);
    },
  };
}

export async function clientIp(): Promise<string> {
  const { headers } = await import('next/headers');
  const h = await headers();
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
