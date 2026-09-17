import { requireClient } from '@/lib/auth/client-session';
import { listMembers, listPendingInvites } from '@/lib/accounts/accounts';
import { Badge, Card, Notice, PageHeader, inputCls, labelCls, primaryBtn, relativeTime } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { inviteAction, removeMemberAction, revokeInviteAction, setRoleAction } from '../actions';

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const ctx = await requireClient();
  const isOwner = ctx.role === 'owner';
  const members = listMembers(ctx.workspace.id);
  const invites = isOwner ? listPendingInvites(ctx.workspace.id) : [];
  const ownerCount = members.filter((m) => m.role === 'owner').length;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader eyebrow="Team" title="Team members" description="Owners manage billing, connections, API keys and the team. Members use the inbox and see settings." />
      {error && <div className="mb-6"><Notice tone="red">{error}</Notice></div>}

      <div className="space-y-6">
        <Card>
          <ul className="-my-3 divide-y divide-line-sub">
            {members.map((m) => {
              const self = m.user_id === ctx.user.id;
              return (
                <li key={m.user_id} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-ink">
                      <span className="truncate">{m.name}{self && ' (you)'}</span>
                      <Badge tone={m.role === 'owner' ? 'blue' : 'gray'}>{m.role === 'owner' ? 'Owner' : 'Member'}</Badge>
                    </div>
                    <div className="truncate text-xs text-ink-dim">{m.email} · joined {relativeTime(m.created_at)}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {isOwner && !self && (
                      <form action={setRoleAction}>
                        <input type="hidden" name="userId" value={m.user_id} />
                        <input type="hidden" name="role" value={m.role === 'owner' ? 'member' : 'owner'} />
                        <button className="text-ink-dim hover:text-ink">{m.role === 'owner' ? 'Make member' : 'Make owner'}</button>
                      </form>
                    )}
                    {(isOwner || self) && !(m.role === 'owner' && ownerCount === 1) && (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="userId" value={m.user_id} />
                        <button className="text-red-500 hover:underline">{self ? 'Leave' : 'Remove'}</button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {isOwner && (
          <Card title="Invite someone" description="They'll get an email link to join. Invitations expire after 7 days.">
            <div className="space-y-5">
              <StatusForm action={inviteAction} submitLabel="Send invitation" pendingText="Sending…" submitClassName={primaryBtn} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" resetOnSuccess>
                <div>
                  <label htmlFor="invite-email" className={labelCls}>Email</label>
                  <input id="invite-email" name="email" type="email" required placeholder="colleague@company.com" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="invite-role" className={labelCls}>Role</label>
                  <select id="invite-role" name="role" defaultValue="member" className={inputCls}>
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </StatusForm>
              {invites.length > 0 && (
                <ul className="space-y-2">
                  {invites.map((i) => (
                    <li key={i.token_hash} className="flex items-center justify-between gap-3 rounded-lg border border-line-sub px-3 py-2 text-xs text-ink-dim">
                      <span className="truncate">{i.email} · {i.role} · expires {relativeTime(i.expires_at)}</span>
                      <form action={revokeInviteAction}>
                        <input type="hidden" name="tokenHash" value={i.token_hash} />
                        <button className="text-red-500 hover:underline">Revoke</button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
