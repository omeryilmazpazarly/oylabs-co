# OY Labs Messaging API: client integration

How a client system (first: Minhaj Kids) receives Messenger and Instagram messages from OY Labs and sends replies back. OY Labs holds the Meta connection; your system never talks to Meta directly.

## Credentials

Everything is in your OY Labs account at **https://oylabs.co/app/developers**:

| Value | Example | Where to keep it |
|---|---|---|
| API key | `oyk_7Ygqqp8XjnHMzny2` | env, e.g. `OYLABS_API_KEY` |
| API secret | `oys_…` (43+ chars) | env, e.g. `OYLABS_API_SECRET`. It's secret and shown once; a workspace owner can **Rotate API secret** to get a new one. |
| Workspace ID | `1` | arrives as `clientId` on every event |

Set your **Forwarding webhook** URL on the same page, e.g. `https://minhaj.kids/api/integrations/oylabs/webhook`, then use **Send signed test event** to check your endpoint.

If the secret leaks, rotate it. The old secret stops working immediately in both directions.

Forwarding and sending require an active plan (trial, paid, or within 7 days of a failed payment). While billing is inactive, inbound messages are still stored and are forwarded once billing is active again.

## 1. Receiving events (OY Labs → you)

For every inbound customer message on a connected Facebook Page (Messenger), its linked Instagram professional account, or a connected WhatsApp number, OY Labs sends:

```
POST <your forwarding URL>
Content-Type: application/json
User-Agent: OYLabs-Webhooks/1.0
X-OYLABS-Event-Id: evt_wz3lEvqO5g0vwJ0P
X-OYLABS-Timestamp: 1789648798            (unix seconds)
X-OYLABS-Signature: sha256=<hex HMAC-SHA256(secret, "<timestamp>.<raw body>")>
```

### Payload

```json
{
  "id": "evt_wz3lEvqO5g0vwJ0P",
  "type": "message.received",
  "clientId": "1",
  "channel": "messenger",
  "direction": "inbound",
  "pageId": "1111111111",
  "igAccountId": null,
  "senderId": "25123456789012345",
  "senderName": "Aisha Rahman",
  "messageId": "msg_6VUXwf1xiDy8xcs8",
  "mid": "m_AbC…",
  "text": "Assalamu alaikum, is there space in the Saturday class?",
  "attachments": [],
  "postback": null,
  "timestamp": "2026-09-17T12:39:57.857Z",
  "raw": { "sender": { "id": "…" }, "recipient": { "id": "…" }, "timestamp": 1789648797857, "message": { "mid": "…", "text": "…" } }
}
```

| Field | Notes |
|---|---|
| `channel` | `"messenger"`, `"instagram"` or `"whatsapp"` |
| `senderId` | Page-scoped ID (PSID) for Messenger, Instagram-scoped ID (IGSID) for Instagram. Stable per person **per Page / IG account**. Use it as the contact key and as `recipientId` when replying. |
| `senderName` | Name, or `@username` on Instagram when no name is available. May be `null` (privacy settings, lookup failure). |
| `igAccountId` | Set only for Instagram events. |
| `text` | Message text, or the button title for a postback. May be `null` for attachment-only messages. |
| `attachments[]` | `{ "type": "image" \| "video" \| "audio" \| "file" \| "share" \| "story_mention" \| …, "url": string \| null }`. Meta's URLs expire, so download anything you want to keep. |
| `postback` | `{ "title", "payload" }` when the customer tapped a button, otherwise `null`. |
| `raw` | Meta's original messaging item, for fields not normalised above. |
| `type` | `message.received`, plus on WhatsApp `message.echo`, `message.history` and `message.status` (below). A `test` type is sent when staff click "Send signed test event". Ignore unknown types. |
| `kind` | Message type: `text`, `image`, `video`, `audio`, `document`, `sticker`, `location`, `contacts`, `interactive`, `button`, `reaction`. |

Replies sent from Meta Business Suite and messages you send through the API are **not** forwarded back to you.

### WhatsApp events

WhatsApp events add these fields:

```json
{
  "type": "message.received",
  "channel": "whatsapp",
  "direction": "inbound",
  "pageId": null,
  "whatsapp": { "phoneNumberId": "109876543210987", "wabaId": "102030405060708", "displayPhoneNumber": "447700900000" },
  "senderId": "BSUID_2f1c…",
  "senderPhone": "447911123456",
  "senderUsername": null,
  "senderName": "Aisha Rahman",
  "kind": "image",
  "text": "Her certificate",
  "attachments": [
    { "type": "image", "url": null, "mediaId": "904050607", "mediaUrl": "https://oylabs.co/api/v1/media/904050607", "mimeType": "image/jpeg", "filename": null }
  ]
}
```

| Field | Notes |
|---|---|
| `senderId` | The **business-scoped user ID (BSUID)**, WhatsApp's stable identifier for that person and your business. Use it as the contact key and as `recipientId`. Falls back to the phone number when WhatsApp doesn't send a BSUID. |
| `senderPhone` | Digits only, no `+`. WhatsApp may omit it for people who use a username and haven't messaged recently, so don't rely on it alone. |
| `senderUsername` | WhatsApp username, when the person uses one. |
| `whatsapp` | Which of your numbers the message arrived on. |
| `attachments[].mediaUrl` | Download it from OY Labs with a signed `GET` (below). WhatsApp's own links need our access token and expire after 5 minutes, so `url` is always `null`. |

Extra WhatsApp event types:

| `type` | When | Notes |
|---|---|---|
| `message.echo` | The business replied from the **WhatsApp Business app** on the phone (coexistence numbers) | `direction: "outbound"`. Mirror it so your inbox matches the phone. |
| `message.history` | Chat history imported when a coexistence number is connected | `direction` is `inbound` or `outbound`. One event per message, limited to the last 90 days. Ignore these if you don't want history. |
| `message.status` | WhatsApp reported a delivery receipt for a message you sent | `status: { "value": "sent" \| "delivered" \| "read" \| "failed", "errors": [...] }`, `messageId` is the id returned when you sent it. |

### Downloading WhatsApp media

```
GET https://oylabs.co/api/v1/media/<mediaId>
X-OYLABS-Key: <API key>
X-OYLABS-Timestamp: <unix seconds>
X-OYLABS-Signature: sha256=<hex HMAC-SHA256(secret, "<timestamp>.")>
```

The signature covers an empty body, so the signed string ends with the dot. The response is the file itself with its `Content-Type`. OY Labs doesn't store media: it is fetched from Meta when you ask, and WhatsApp deletes it after about 30 days, so download anything you need to keep.

### Verifying (required)

Verify against the **raw** body before parsing JSON, reject anything older than 5 minutes, and use a constant-time comparison.

```js
// Next.js route handler: app/api/integrations/oylabs/webhook/route.js
import { createHmac, timingSafeEqual } from 'node:crypto';

export async function POST(request) {
  const raw = await request.text();
  const timestamp = request.headers.get('x-oylabs-timestamp');
  const signature = request.headers.get('x-oylabs-signature') ?? '';

  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return new Response('stale', { status: 401 });
  }
  const expected = 'sha256=' + createHmac('sha256', process.env.OYLABS_API_SECRET)
    .update(`${timestamp}.${raw}`)
    .digest('hex');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return new Response('bad signature', { status: 401 });
  }

  const event = JSON.parse(raw);
  if (event.type !== 'message.received') return new Response('ignored', { status: 200 });

  // Idempotency: OY Labs may deliver the same event more than once.
  // Store event.id (or event.mid) with a unique constraint and skip duplicates.
  await saveInboundMessage(event); // map channel → conversation channel, senderId → contact key
  return new Response('ok', { status: 200 });
}
```

### Delivery rules

- Respond `2xx` within **10 seconds**. Do slow work after acknowledging.
- Any other status, a redirect, a timeout or a network error counts as a failure. Retries happen after 30s, 2m, 10m, 30m, 1h, 3h, 6h and 12h, then the event is marked failed and OY Labs staff can replay it.
- Delivery is **at least once**, so deduplicate on `id`. Order is not guaranteed; sort by `timestamp`.

## 2. Sending messages (you → OY Labs → Meta)

```
POST https://oylabs.co/api/v1/messages
Content-Type: application/json
X-OYLABS-Key: <API key>
X-OYLABS-Timestamp: <unix seconds>
X-OYLABS-Signature: sha256=<hex HMAC-SHA256(secret, "<timestamp>.<raw body>")>
Idempotency-Key: <optional, up to 200 chars, e.g. your outbound message UUID>
```

Body:

```json
{ "channel": "messenger", "recipientId": "25123456789012345", "text": "Wa alaykum assalam! Yes, two places left." }
```

| Field | Required | Notes |
|---|---|---|
| `channel` | yes | `"messenger"`, `"instagram"` or `"whatsapp"` |
| `recipientId` | yes | The `senderId` from an inbound event. On WhatsApp you may also pass a phone number in international format, but only with a `template`. |
| `text` | one of | Messenger ≤ 2000 characters; Instagram ≤ 1000 bytes UTF-8; WhatsApp ≤ 4096 |
| `attachment` | one of | `{ "type": "image" \| "video" \| "audio" \| "file", "url": "https://…" }` (publicly reachable HTTPS URL). On WhatsApp the types are `image`, `video`, `audio`, `document`, `sticker`, plus optional `caption` and `filename`. |
| `template` | one of | **WhatsApp only.** An approved template: `{ "name": "order_ready", "language": { "code": "en_US" }, "components": [...] }`, in Meta's own shape. |
| `pageId` | only if your workspace has several Pages | Which connected Page to send from |
| `phoneNumberId` | only if your workspace has several WhatsApp numbers | Which number to send from |
| `tag` | no | `"HUMAN_AGENT"`, Messenger and Instagram only. Only accepted once OY Labs has Meta's Human Agent approval (see window rules). |

Send exactly one of `text`, `attachment` or `template`.

WhatsApp template example — this both re-opens a conversation after 24 hours and starts a new one:

```json
{
  "channel": "whatsapp",
  "recipientId": "447911123456",
  "template": {
    "name": "class_reminder",
    "language": { "code": "en_US" },
    "components": [
      { "type": "body", "parameters": [{ "type": "text", "text": "Aisha" }, { "type": "text", "text": "Saturday 10am" }] }
    ]
  }
}
```

Templates are created and approved in the OY Labs account under **Templates** (or in Meta's WhatsApp Manager). `components` is optional when the template has no variables.

```js
import { createHmac, randomUUID } from 'node:crypto';

export async function sendViaOylabs({ channel, recipientId, text }) {
  const body = JSON.stringify({ channel, recipientId, text });
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = 'sha256=' + createHmac('sha256', process.env.OYLABS_API_SECRET)
    .update(`${timestamp}.${body}`)
    .digest('hex');

  const res = await fetch('https://oylabs.co/api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-OYLABS-Key': process.env.OYLABS_API_KEY,
      'X-OYLABS-Timestamp': String(timestamp),
      'X-OYLABS-Signature': signature,
      'Idempotency-Key': randomUUID(),
    },
    body, // must be the exact string that was signed
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error.message), { code: json.error.code, status: res.status });
  return json;
}
```

### Success

`201 Created` (or `200 OK` when an `Idempotency-Key` replays an earlier successful send):

```json
{ "id": "msg_Q1w2E3r4T5y6U7i8", "mid": "m_…", "conversationId": 42, "channel": "messenger", "recipientId": "25123456789012345", "sentAt": "2026-09-17T12:41:02.114Z", "replayed": false }
```

### Errors

`{ "error": { "code": "…", "message": "…", "metaCode": 190 } }` (`metaCode` only when Meta returned an error).

| HTTP | `code` | Meaning / what to do |
|---|---|---|
| 400 | `invalid_request` | Fix the body. |
| 400 | `page_id_required` | Workspace has several Pages or WhatsApp numbers; pass `pageId` or `phoneNumberId`. |
| 401 | `missing_api_key`, `invalid_api_key`, `signature_missing`, `signature_stale`, `signature_mismatch` | Check key, secret, clock (±5 min) and that you sign the exact bytes you send. |
| 404 | `connection_not_found` | No active Page (or no linked Instagram account) for this channel. |
| 404 | `conversation_not_found` | This person never messaged the business, so Meta forbids messaging them. On WhatsApp, send an approved `template` to a phone number instead. |
| 409 | `reconnect_needed` | Meta rejected the token (password change, removed access, expired). A Page admin must reconnect. Don't retry until then. |
| 402 | `subscription_inactive` | No active plan (trial ended, cancelled, or payment failed more than 7 days ago). An owner must update billing. |
| 413 | `payload_too_large` | Body over 64 KB. |
| 422 | `outside_messaging_window` | More than 24 h since the customer's last message. Wait for them to write again. |
| 422 | `human_agent_not_approved` | `HUMAN_AGENT` was requested but isn't enabled. |
| 400 | `template_invalid` | WhatsApp rejected the template name, language or parameters. Check it is approved and that every variable has a value. |
| 429 | `rate_limited` | More than 60 requests/minute for your workspace; honour `Retry-After`. |
| 429 | `meta_rate_limited` | Meta throttled the Page. Retry later with backoff. |
| 502 | `meta_error` | Meta refused or failed. Safe to retry with the same `Idempotency-Key`. |
| 503 | `not_configured` | OY Labs side misconfigured. Contact OY Labs. |

## 3. Messaging window rules (Meta policy)

### Messenger and Instagram

- **Standard window:** you may reply for **24 hours** after the customer's most recent message. Each new customer message restarts it.
- **After 24 hours:** only the `HUMAN_AGENT` tag allows a reply, up to **7 days** after the customer's last message. It is for a human replying manually to a request that couldn't be answered in 24 hours, never for automation or promotions, and requires Meta approval for the OY Labs app. Until approved, the API returns `human_agent_not_approved`.
- You can never start a conversation. The customer must message first (`conversation_not_found`).
- OY Labs enforces these rules before calling Meta, so a refused send costs you nothing.

### WhatsApp

- **Customer service window:** free-form text and media are allowed for **24 hours** after the customer's last message. Each new message restarts it.
- **After 24 hours, or to start a conversation:** only an **approved template**. Meta must approve each template (usually within minutes), and you must have the person's opt-in to receive WhatsApp messages from the business.
- **Meta charges for WhatsApp messages directly**, under its own per-message pricing, to the card the business adds in WhatsApp Manager. It is separate from the OY Labs subscription.
- **Coexistence numbers** (also used in the WhatsApp Business app) are limited by WhatsApp to 20 messages per second, and don't support group chats, broadcast lists, or disappearing and view-once messages.

## 4. Connecting, reconnecting, disconnecting

- **Connect:** a workspace owner clicks **Connect Facebook & Instagram** under Connections in the OY Labs account (or opens a single-use link from OY Labs, valid 7 days). Sign in with a Facebook account that administers the Page, share your business and Page, and choose the Page. The linked Instagram professional account is picked up automatically. Your plan sets how many Pages you can connect. For Instagram, also turn on *Allow access to messages* (Instagram app → Settings → Messages and story replies → Message controls → Connected tools).
- **Reconnect:** when sends return `reconnect_needed`, click Connect again and choose the same Page. History and IDs are kept, and it doesn't use an extra Page from your plan.
- **Disconnect:** click Disconnect under Connections, or remove the OY Labs app in Facebook Settings → Business Integrations (Meta Business Suite → Settings → Integrations). OY Labs unsubscribes from the Page and deletes its tokens.
- **WhatsApp:** under Connections choose **Use my WhatsApp Business app number** (coexistence — the app on the phone keeps working, and contacts and up to 90 days of chats are imported) or **Connect a new number**. A WhatsApp number counts as one channel on your plan, like a Page. Disconnecting deletes OY Labs' token, the synced contacts and the template mirror; the number itself and its WhatsApp history stay with the business.

## 5. Data held by OY Labs

Messages are kept by OY Labs for 90 days, then deleted. Media files are never stored — they are fetched from Meta on request. Your system is the long-term record. See https://oylabs.co/privacy.

## Mapping suggestions for Minhaj

| OY Labs | Minhaj inbox |
|---|---|
| `channel` (`messenger` / `instagram` / `whatsapp`) | conversation channel (alongside `whatsapp_web`, `sms`) |
| `senderId` | contact external ID (the `wa_id` equivalent), unique per `(channel, pageId / igAccountId / whatsapp.phoneNumberId)` |
| `senderPhone` | contact phone number on WhatsApp — match existing contacts on it, but key the conversation on `senderId` |
| `senderName` | contact display name if empty |
| `id` | unique inbound event key |
| `messageId` / `mid` | message external ID |
| `/api/v1/messages` response `id` | outbound message external ID |
| `message.echo` | message sent by staff from the WhatsApp Business app — store as outbound, don't re-send |
| `message.history` | imported past message — store with its original timestamp, or ignore |
| `message.status` | update the delivery state of the outbound message with that `messageId` |

Minhaj's WhatsApp moves to OY Labs through coexistence: the existing number keeps working in the WhatsApp Business app, and OY Labs forwards its messages with `channel: "whatsapp"` alongside Messenger and Instagram.
