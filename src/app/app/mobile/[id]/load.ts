import 'server-only';
import { notFound } from 'next/navigation';
import { requireClient } from '@/lib/auth/client-session';
import { getWorkspaceApp } from '@/lib/apps/apps';
import { parseSettings } from '@/lib/apps/settings';

/** Pages re-check access themselves: layouts don't re-run on client navigation. */
export async function loadApp(params: Promise<{ id: string }>) {
  const ctx = await requireClient();
  const app = getWorkspaceApp(ctx.workspace.id, Number((await params).id));
  if (!app) notFound();
  return { ctx, app, settings: parseSettings(app.settings), isOwner: ctx.role === 'owner' };
}
