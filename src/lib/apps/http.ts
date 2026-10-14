import 'server-only';
import { NextResponse } from 'next/server';
import { createThrottle } from '@/lib/auth/throttle';
import { getAppByPublicKey, type MobileApp } from './apps';

/**
 * Helpers for the public mobile endpoints (/api/mobile/v1/*). Installed apps
 * identify themselves with the app's public key, which ships inside the app and
 * is not a secret: it only reads public config and registers devices.
 */

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type, x-app-key',
};

export function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { ...CORS, ...headers } });
}

export function fail(status: number, code: string, message: string) {
  return json(status, { error: { code, message } });
}

export function preflight() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Per-IP write budget: 60 device/alert writes per 10 minutes. */
const writes = createThrottle(60, 10 * 60 * 1000);

export function writeAllowed(ip: string): boolean {
  if (writes.blocked(ip)) return false;
  writes.fail(ip);
  return true;
}

export function appFromKey(key: string | null): MobileApp | null {
  if (!key || !/^oyapp_[A-Za-z0-9_-]{10,}$/.test(key)) return null;
  return getAppByPublicKey(key);
}

export function ipOf(headers: Headers): string {
  return headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
