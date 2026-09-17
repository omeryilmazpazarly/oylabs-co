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

export function ConnectWhatsApp({ appId, configId, linkToken, onComplete, disabled }: {
  appId: string;
  configId: string;
  linkToken?: string;
  onComplete: (payload: SignupPayload) => Promise<{ error?: string } | void>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<'existing' | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<{ wabaId?: string; phoneNumberId?: string }>({});

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

  const loadSdk = useCallback(() => new Promise<void>((resolve, reject) => {
    if (window.FB) return resolve();
    const script = document.createElement('script');
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version: 'v25.0' });
      resolve();
    };
    script.onerror = () => reject(new Error('Facebook could not be reached.'));
    document.body.appendChild(script);
  }), [appId]);

  const start = async (coexistence: boolean) => {
    setError(null);
    setBusy(coexistence ? 'existing' : 'new');
    session.current = {};
    try {
      await loadSdk();
    } catch {
      setError('Facebook could not be loaded. Check your connection or any ad blocker, then try again.');
      setBusy(null);
      return;
    }
    window.FB!.login(async (response) => {
      const code = response.authResponse?.code;
      const { wabaId, phoneNumberId } = session.current;
      if (!code || !wabaId || !phoneNumberId) {
        setBusy(null);
        if (code || response.status === 'connected') setError('WhatsApp did not return the number details. Please try again.');
        return;
      }
      const result = await onComplete({ code, wabaId, phoneNumberId, coexistence, linkToken });
      setBusy(null);
      if (result?.error) setError(result.error);
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => start(true)} disabled={disabled || busy !== null} className={`${primaryBtn} disabled:opacity-60`}>
          <WhatsAppIcon size={15} /> {busy === 'existing' ? 'Opening WhatsApp…' : 'Use my WhatsApp Business app number'}
        </button>
        <button type="button" onClick={() => start(false)} disabled={disabled || busy !== null} className={`${secondaryBtn} disabled:opacity-60`}>
          {busy === 'new' ? 'Opening WhatsApp…' : 'Connect a new number'}
        </button>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
