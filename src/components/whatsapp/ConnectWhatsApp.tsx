'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { primaryBtn, secondaryBtn, WhatsAppIcon } from '@/components/console/ui';

/**
 * WhatsApp Embedded Signup. Meta requires its JavaScript SDK pop-up: the
 * window messages carry the WhatsApp Business Account and phone number IDs,
 * and FB.login returns a short-lived code we exchange on the server.
 */

declare global {
  interface Window {
    FB?: { init: (options: Record<string, unknown>) => void; login: (cb: (r: FbLoginResponse) => void, options: Record<string, unknown>) => void };
    fbAsyncInit?: () => void;
  }
}

interface FbLoginResponse { authResponse?: { code?: string } | null; status?: string }
interface SignupPayload { code: string; wabaId: string; phoneNumberId: string; coexistence: boolean; linkToken?: string }

const SDK_URL = 'https://connect.facebook.net/en_US/sdk.js';

/** Loads and initialises the Facebook SDK once per page. */
function loadSdk(appId: string): Promise<void> {
  const w = window as Window & { __oyFbSdk?: Promise<void> };
  if (w.FB) return Promise.resolve();
  if (w.__oyFbSdk) return w.__oyFbSdk;
  w.__oyFbSdk = new Promise<void>((resolve, reject) => {
    window.fbAsyncInit = () => {
      window.FB!.init({ appId, autoLogAppEvents: true, xfbml: false, version: 'v23.0' });
      resolve();
    };
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      w.__oyFbSdk = undefined;
      reject(new Error('Facebook could not be reached.'));
    };
    document.body.appendChild(script);
  });
  return w.__oyFbSdk;
}

export function ConnectWhatsApp({ appId, configId, linkToken, onComplete, disabled }: {
  appId: string;
  configId: string;
  linkToken?: string;
  onComplete: (payload: SignupPayload) => Promise<{ error?: string } | void>;
  disabled?: boolean;
}) {
  const [sdk, setSdk] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [busy, setBusy] = useState<'existing' | 'new' | 'saving' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const session = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

  // Load the SDK up front: the pop-up must open straight from the click, or browsers block it.
  useEffect(() => {
    loadSdk(appId).then(() => setSdk('ready'), () => setSdk('failed'));
  }, [appId]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return;
      try {
        const data = JSON.parse(event.data as string) as { type?: string; event?: string; data?: { waba_id?: string; phone_number_id?: string } };
        if (data.type !== 'WA_EMBEDDED_SIGNUP') return;
        if (data.data?.waba_id) session.current = { wabaId: data.data.waba_id, phoneNumberId: data.data.phone_number_id };
        if (data.event === 'CANCEL') setBusy(null);
      } catch {
        /* Facebook also posts non-JSON messages. */
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const finish = useCallback(async (code: string, coexistence: boolean) => {
    // The WhatsApp session message can arrive just after the login callback.
    for (let i = 0; i < 10 && !session.current.wabaId; i++) await new Promise((r) => setTimeout(r, 300));
    const { wabaId, phoneNumberId } = session.current;
    if (!wabaId || !phoneNumberId) {
      setBusy(null);
      setError('WhatsApp did not return the number details. Please try again.');
      return;
    }
    setBusy('saving');
    try {
      const result = await onComplete({ code, wabaId, phoneNumberId, coexistence, linkToken });
      if (result?.error) setError(result.error);
      else setDone(true);
    } catch {
      setError('Something went wrong saving the connection. Please try again.');
    } finally {
      setBusy(null);
    }
  }, [onComplete, linkToken]);

  const start = (coexistence: boolean) => {
    if (!window.FB) {
      setError('Facebook is still loading — please try again in a moment.');
      return;
    }
    setError(null);
    setDone(false);
    setBusy(coexistence ? 'existing' : 'new');
    session.current = {};
    // Called synchronously from the click so the pop-up isn't blocked. The SDK
    // rejects async callbacks, so this one is a plain function.
    window.FB.login((response) => {
      const code = response.authResponse?.code;
      if (!code) {
        setBusy(null); // closed, cancelled or blocked
        return;
      }
      void finish(code, coexistence);
    }, {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        sessionInfoVersion: '3',
        ...(coexistence ? { featureType: 'whatsapp_business_app_onboarding' } : {}),
      },
    });
  };

  const blocked = disabled || busy !== null || sdk !== 'ready';
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => start(true)} disabled={blocked} className={`${primaryBtn} disabled:opacity-60`}>
          <WhatsAppIcon size={15} /> {busy === 'existing' ? 'Waiting for WhatsApp…' : busy === 'saving' ? 'Connecting…' : sdk === 'loading' ? 'Loading…' : 'Use my WhatsApp Business app number'}
        </button>
        <button type="button" onClick={() => start(false)} disabled={blocked} className={`${secondaryBtn} disabled:opacity-60`}>
          {busy === 'new' ? 'Waiting for WhatsApp…' : 'Connect a new number'}
        </button>
      </div>
      {sdk === 'failed' && <p className="text-sm text-red-300">Facebook could not be loaded. Check your connection or any ad or privacy blocker, then reload the page.</p>}
      {busy === 'existing' || busy === 'new' ? (
        <p className="text-xs text-ink-dull">
          Finish the steps in the Facebook window. If Chrome asks to sign in to oylabs.co with Facebook, choose Continue. No window?{' '}Allow pop-ups for oylabs.co.{' '}
          <button type="button" onClick={() => setBusy(null)} className="underline hover:text-ink">Cancel</button>
        </p>
      ) : null}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {done && <p className="text-sm text-emerald-300">WhatsApp connected.</p>}
    </div>
  );
}
