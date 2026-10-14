import { NextResponse, type NextRequest } from 'next/server';
import { getClient } from '@/lib/auth/client-session';
import { getStaff } from '@/lib/auth/session';
import { AppError, getApp } from '@/lib/apps/apps';
import { saveAppImage } from '@/lib/apps/uploads';

/** POST /api/mobile/upload (multipart: appId, file) — portal and console image uploads. */
export async function POST(request: NextRequest) {
  const fd = await request.formData();
  const app = getApp(Number(fd.get('appId')));
  if (!app) return NextResponse.json({ error: 'App not found.' }, { status: 404 });
  const staff = await getStaff();
  const client = staff ? null : await getClient();
  const allowed = staff || client?.workspaces.some((w) => w.id === app.workspace_id);
  if (!allowed) return NextResponse.json({ error: 'Not authorised.' }, { status: 401 });
  const file = fd.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file.' }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveAppImage(app.id, file) });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }
}
