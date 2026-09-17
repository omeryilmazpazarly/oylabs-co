import { requireClient } from '@/lib/auth/client-session';
import { Card, PageHeader, inputCls, labelCls, primaryBtn, secondaryBtn } from '@/components/console/ui';
import { StatusForm } from '@/components/console/client';
import { changePasswordAction, updateProfileAction } from '../actions';

export default async function SettingsPage() {
  const ctx = await requireClient();
  const isOwner = ctx.role === 'owner';
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Settings" title="Account settings" />
      <div className="space-y-6">
        <Card title="Profile">
          <StatusForm action={updateProfileAction} submitLabel="Save" pendingText="Saving…" submitClassName={primaryBtn}>
            <div>
              <label htmlFor="name" className={labelCls}>Your name</label>
              <input id="name" name="name" defaultValue={ctx.user.name} required className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" value={ctx.user.email} disabled className={inputCls} />
              <p className="mt-1.5 text-xs text-ink-dim">To change your email, contact hi@oylabs.co.</p>
            </div>
            {isOwner && (
              <div>
                <label htmlFor="workspaceName" className={labelCls}>Business name</label>
                <input id="workspaceName" name="workspaceName" defaultValue={ctx.workspace.name} required className={inputCls} />
              </div>
            )}
          </StatusForm>
        </Card>
        <Card title="Change password">
          <StatusForm action={changePasswordAction} submitLabel="Change password" pendingText="Saving…" submitClassName={secondaryBtn} resetOnSuccess>
            <div>
              <label htmlFor="currentPassword" className={labelCls}>Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required className={inputCls} />
            </div>
            <div>
              <label htmlFor="newPassword" className={labelCls}>New password</label>
              <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={12} required className={inputCls} />
              <p className="mt-1.5 text-xs text-ink-dim">At least 12 characters.</p>
            </div>
          </StatusForm>
        </Card>
        <Card title="Delete account">
          <p className="text-sm text-ink-dim">
            To close your account and delete your data, cancel your subscription under Billing, then email{' '}<a href="mailto:hi@oylabs.co" className="text-ink underline">hi@oylabs.co</a>{' '}from your account email. We confirm within one month. See the{' '}<a href="/privacy" className="text-ink underline">privacy policy</a>.
          </p>
        </Card>
      </div>
    </div>
  );
}
