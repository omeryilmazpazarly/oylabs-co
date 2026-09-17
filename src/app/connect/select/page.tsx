import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConnectError, pendingPageChoices, STATE_COOKIE } from '@/lib/messaging/connections';
import { FacebookIcon, InstagramIcon, primaryBtn } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import ConnectShell from '../ConnectShell';
import { choosePageAction } from './actions';

export const metadata = { title: 'Choose a Page — OY Labs', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SelectPage() {
  let data: ReturnType<typeof pendingPageChoices>;
  try {
    data = pendingPageChoices((await cookies()).get(STATE_COOKIE)?.value);
  } catch (err) {
    redirect(`/connect/error?reason=${err instanceof ConnectError ? err.reason : 'state'}`);
  }

  const available = data.pages.filter((p) => !p.connectedElsewhere);

  return (
    <ConnectShell>
      <h1 className="text-xl font-bold tracking-tight text-ink">Choose the Page to connect</h1>
      <p className="mt-1.5 text-sm text-ink-dim">These are the Pages you shared with OY Labs. Messages for the Page you choose, and its linked Instagram account, will go to {data.workspaceName}.</p>

      <form action={choosePageAction} className="mt-6 space-y-3">
        {data.pages.map((p, i) => (
          <label
            key={p.id}
            className={`flex items-center gap-3 rounded-xl border border-line p-4 transition has-[:checked]:border-line-hi has-[:checked]:bg-elevated ${p.connectedElsewhere ? 'opacity-50' : 'cursor-pointer hover:border-line-hi'}`}
          >
            <input type="radio" name="pageId" value={p.id} required disabled={p.connectedElsewhere} defaultChecked={available[0]?.id === p.id && i === data.pages.indexOf(available[0])} className="accent-current" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-ink"><FacebookIcon size={14} className="text-sky-500" /> <span className="truncate">{p.name}</span></div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-ink-dim">
                {p.hasInstagram
                  ? <><InstagramIcon size={12} className="text-pink-500" /> {p.igUsername ? `@${p.igUsername}` : 'Instagram account linked'}</>
                  : 'No Instagram professional account linked — Messenger only'}
              </div>
              {p.connectedElsewhere && <div className="mt-1 text-xs text-amber-500">Already connected to another OY Labs client</div>}
            </div>
          </label>
        ))}
        <SubmitButton className={`${primaryBtn} mt-2 w-full`} pendingText="Connecting…">Connect Page</SubmitButton>
      </form>
    </ConnectShell>
  );
}
