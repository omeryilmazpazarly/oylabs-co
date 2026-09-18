import { Badge, Card, secondaryBtn, WhatsAppIcon } from '@/components/console/ui';
import { SubmitButton } from '@/components/console/client';
import type { WaNumber } from '@/lib/whatsapp/numbers';
import type { PlainAction } from '@/components/messaging/types';

const HISTORY_LABEL: Record<string, string> = {
  requested: 'Importing chats from your phone…',
  in_progress: 'Importing chats from your phone…',
  complete: 'Chats and contacts imported',
  declined: 'History sharing is off in the WhatsApp Business app',
  failed: 'Chat import did not start',
};

/** WhatsApp numbers with their connection and (for coexistence) import state. */
export function WaNumberList({ numbers, disconnectAction, retrySyncAction, emptyHint, nowMs }: {
  numbers: WaNumber[];
  /** Server time, for the reconnect-by warning. */
  nowMs: number;
  disconnectAction?: PlainAction;
  retrySyncAction?: PlainAction;
  emptyHint: string;
}) {
  if (numbers.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <WhatsAppIcon size={22} className="mx-auto text-ink-dull" />
        <p className="mt-3 text-sm font-medium text-ink">No WhatsApp number connected</p>
        <p className="mx-auto mt-1 max-w-md text-xs text-ink-dull">{emptyHint}</p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {numbers.map((n) => (
        <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <WhatsAppIcon size={14} className="text-ink-dull" />
              {n.verified_name || n.display_phone_number}
              {n.status === 'active' ? <Badge tone="green">Active</Badge>
                : n.status === 'reconnect_needed' ? <Badge tone="amber">Reconnect needed</Badge>
                : <Badge>Disconnected</Badge>}
              {Boolean(n.coexistence) && <Badge tone="blue">Business app</Badge>}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-dull">
              {n.display_phone_number}
              {n.quality_rating && n.quality_rating !== 'UNKNOWN' ? ` · quality ${n.quality_rating.toLowerCase()}` : ''}
              {n.history_status ? ` · ${HISTORY_LABEL[n.history_status] ?? n.history_status}` : ''}
              {n.status_detail ? ` · ${n.status_detail}` : ''}
            </p>
            {n.status === 'active' && n.token_expires_at && (
              <p className={`mt-0.5 text-xs ${n.token_expires_at - nowMs < 14 * 24 * 60 * 60 * 1000 ? 'text-amber-400' : 'text-ink-dull'}`}>
                Meta&rsquo;s access renews every 60 days — reconnect by {new Date(n.token_expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. We&rsquo;ll email a reminder a week before.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {retrySyncAction && Boolean(n.coexistence) && n.history_status === 'failed' && n.status === 'active' && (
              <form action={retrySyncAction}>
                <input type="hidden" name="numberId" value={n.id} />
                <SubmitButton className={secondaryBtn} pendingText="Starting…">Retry import</SubmitButton>
              </form>
            )}
            {disconnectAction && n.status !== 'disconnected' && (
              <form action={disconnectAction}>
                <input type="hidden" name="numberId" value={n.id} />
                <SubmitButton className="text-xs text-red-300 hover:text-red-200" pendingText="Disconnecting…">Disconnect</SubmitButton>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function WaCoexistenceNote() {
  return (
    <>Keep using WhatsApp on your phone as usual — replies you send there appear here too. WhatsApp does not support group chats, broadcast lists, or disappearing and view-once messages through this connection.</>
  );
}

export { Card };
