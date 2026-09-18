#!/usr/bin/env node
/**
 * Registers the app's webhook subscriptions with Meta — Pages (Messenger),
 * Instagram and WhatsApp — using the app access token, so the verify token
 * never has to be pasted into the dashboard. Safe to re-run.
 *
 *   cd /var/www/oylabs && node --env-file=.env.production scripts/meta-setup.mjs
 *   node --env-file=.env.production scripts/meta-setup.mjs --check   # only report
 */

const GRAPH = 'https://graph.facebook.com/v23.0';
const { META_APP_ID: appId, META_APP_SECRET: secret, META_VERIFY_TOKEN: verifyToken, APP_BASE_URL: base = 'https://oylabs.co' } = process.env;
const checkOnly = process.argv.includes('--check');

const SUBSCRIPTIONS = {
  page: ['messages', 'messaging_postbacks', 'message_echoes'],
  instagram: ['messages', 'messaging_postbacks'],
  whatsapp_business_account: ['messages', 'smb_message_echoes', 'smb_app_state_sync', 'history', 'message_template_status_update', 'account_update'],
};

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (!appId || !secret || !verifyToken) fail('META_APP_ID, META_APP_SECRET and META_VERIFY_TOKEN must be set in .env.production.');

async function graph(method, path, params = {}) {
  const url = new URL(`${GRAPH}/${path}`);
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) (method === 'GET' ? url.searchParams : body).set(key, String(value));
  const res = await fetch(url, method === 'GET' ? {} : { method, body });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json;
}

// 1. The secret must be right before anything else — webhook signatures and code exchanges depend on it.
let appToken;
try {
  appToken = (await graph('GET', 'oauth/access_token', { client_id: appId, client_secret: secret, grant_type: 'client_credentials' })).access_token;
} catch (err) {
  fail(`Meta rejected the app secret (${err.message}). Re-copy it from App settings → Basic and save it again.`);
}
console.log('✓ App secret is valid');

// 2. The endpoint must answer Meta's verification handshake.
const challenge = String(Date.now());
const probe = await fetch(`${base}/api/meta/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${challenge}`);
if ((await probe.text()) !== challenge) fail(`${base}/api/meta/webhook did not echo the challenge (HTTP ${probe.status}). Is the app running with the current .env.production?`);
console.log('✓ Webhook endpoint answers the handshake');

// 3. Subscribe each object.
if (!checkOnly) {
  for (const [object, fields] of Object.entries(SUBSCRIPTIONS)) {
    try {
      await graph('POST', `${appId}/subscriptions`, {
        object, callback_url: `${base}/api/meta/webhook`, verify_token: verifyToken, fields: fields.join(','), include_values: 'true', access_token: appToken,
      });
      console.log(`✓ Subscribed ${object}: ${fields.join(', ')}`);
    } catch (err) {
      console.error(`✗ ${object}: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

// 4. Report what Meta has on record.
const current = await graph('GET', `${appId}/subscriptions`, { access_token: appToken });
for (const sub of current.data ?? []) {
  console.log(`  ${sub.active ? 'active ' : 'INACTIVE'} ${sub.object.padEnd(26)} ${sub.callback_url}  [${(sub.fields ?? []).map((f) => f.name).join(', ')}]`);
}
if (!current.data?.length) console.log('  (no subscriptions yet)');
