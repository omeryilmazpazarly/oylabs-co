import 'server-only';

/**
 * Structured JSON logs. Callers pass identifiers and outcomes only — never
 * message text, attachment URLs, tokens or secrets.
 */
type Fields = Record<string, string | number | boolean | null | undefined>;

function write(level: 'info' | 'warn' | 'error', event: string, fields: Fields = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const log = {
  info:  (event: string, fields?: Fields) => write('info', event, fields),
  warn:  (event: string, fields?: Fields) => write('warn', event, fields),
  error: (event: string, fields?: Fields) => write('error', event, fields),
};

/** Error message safe to log: first line only, capped, no request bodies. */
export function errorSummary(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  return text.split('\n')[0].slice(0, 300);
}
