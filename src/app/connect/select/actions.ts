'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConnectError, finalizeConnection, STATE_COOKIE } from '@/lib/messaging/connections';

export async function choosePageAction(formData: FormData) {
  const store = await cookies();
  const pageId = String(formData.get('pageId') ?? '');
  let target: string;
  try {
    const { workspaceName, connection } = await finalizeConnection(store.get(STATE_COOKIE)?.value, pageId);
    store.delete(STATE_COOKIE);
    const query = new URLSearchParams({ w: workspaceName, page: connection.page_name, ig: connection.ig_username ?? '' });
    target = `/connect/done?${query}`;
  } catch (err) {
    target = `/connect/error?reason=${err instanceof ConnectError ? err.reason : 'meta'}`;
  }
  redirect(target);
}
