'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertStaff } from '@/lib/auth/session';
import { AppError, createApp, getApp, markSetupPaid, setAppStatus, updateBuildInfo, type AppStatus } from '@/lib/apps/apps';
import { errorSummary, log } from '@/lib/log';

type Result = { status: 'idle' } | { status: 'error'; message: string } | { status: 'ok'; message: string };

export async function createAppAction(_prev: Result, fd: FormData): Promise<Result> {
  const staff = await assertStaff();
  let id: number;
  try {
    const app = createApp({
      workspaceId: Number(fd.get('workspaceId')),
      name: String(fd.get('name') ?? ''),
      slug: String(fd.get('slug') ?? ''),
    });
    id = app.id;
    log.info('mobile_app.created', { appId: id, staffId: staff.id });
  } catch (err) {
    return { status: 'error', message: err instanceof AppError ? err.message : errorSummary(err) };
  }
  redirect(`/console/apps/${id}`);
}

export async function updateAppAction(_prev: Result, fd: FormData): Promise<Result> {
  await assertStaff();
  const app = getApp(Number(fd.get('appId')));
  if (!app) return { status: 'error', message: 'App not found.' };
  try {
    updateBuildInfo(app.id, {
      name: String(fd.get('name') ?? ''),
      androidPackage: String(fd.get('androidPackage') ?? ''),
      iosBundleId: String(fd.get('iosBundleId') ?? ''),
      easProjectId: String(fd.get('easProjectId') ?? ''),
    });
    const status = String(fd.get('status')) as AppStatus;
    if (['setup', 'building', 'live', 'paused'].includes(status)) setAppStatus(app.id, status);
    if (fd.get('setupPaid') === 'on' && !app.setup_paid_at) markSetupPaid(app.id, null);
    revalidatePath(`/console/apps/${app.id}`);
    revalidatePath('/console/apps');
    return { status: 'ok', message: 'Saved.' };
  } catch (err) {
    return { status: 'error', message: err instanceof AppError ? err.message : errorSummary(err) };
  }
}
