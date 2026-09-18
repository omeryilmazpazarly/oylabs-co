# Messaging system: architecture, configuration, operations

The Meta Messenger + Instagram integration inside the oylabs.co Next.js app. Client-facing contract: `docs/client-integration.md`. Meta setup: `docs/meta-onboarding-checklist.md`.

## How it fits together

```
Customer ──Messenger / Instagram DM──► Meta ──signed webhook──► POST /api/meta/webhook
                                                                  │ verify X-Hub-Signature-256
                                                                  │ store one row per item (dedupe) → 200
                                                                  ▼
                                                         webhook_events (queue)
                                                                  │  background worker (every 2s + on arrival)
                                                                  │  route: Page ID / IG account ID → workspace
                                                                  ▼
                                   conversations + messages ──► deliveries (queue) ──signed POST──► client system
                                                                                     retries 30s … 12h, then "dead"

Client system ──signed POST /api/v1/messages──► sendMessage(): auth, window rules, Graph Send API ──► Meta ──► Customer
Staff console reply box ───────────────────────► sendMessage() (same path)
```

- **One Node process.** PM2 runs a single Next.js server. `src/instrumentation.ts` starts the worker in that process (`MESSAGING_WORKER=off` disables it). All queue state is in SQLite, so restarts lose nothing: rows locked by a dead process are retried after their 60s lock expires.
- **Database:** `data/messaging.db` (SQLite, WAL), separate from `data/portfolio.db`. Schema and append-only migrations are in `src/lib/messaging/db.ts`.
- **Connecting:** Facebook Login for Business with a `config_id` (manual OAuth redirect, `response_type=code`). The code is exchanged for a business-integration system-user token (non-expiring). A user token is upgraded to long-lived if the configuration issues one. The Pages are read from `/me/accounts` and stored with their Page tokens encrypted on a 30-minute `oauth_sessions` row bound to an `HttpOnly` state cookie. The chosen Page is subscribed to webhooks and saved to `connections`.
- **Secrets at rest:** Page tokens, business tokens and client API secrets use AES-256-GCM with `TOKEN_ENCRYPTION_KEY` (`src/lib/messaging/crypto.ts`). Connect links, session tokens and OAuth state are stored as SHA-256 hashes only.
- **Auth:** staff accounts (`staff_users`) with scrypt hashes and database sessions (`oy_session` cookie, 12h). `requireStaff()` guards pages; `assertStaff()` guards server actions and routes, including the pre-existing portfolio admin and `/api/upload`. Login is throttled to 5 failures per email+IP per 15 minutes (in memory).
- **Logs:** JSON lines via `src/lib/log.ts`, with IDs and outcomes only. Never message text, attachment URLs, tokens or secrets.

## Accounts and billing

- **Two kinds of login.** Staff use `/console/login` (`staff_users`, cookie `oy_session`). Clients use `/login` and `/signup` (`client_users`, cookie `oy_client`, 30 days) and work in `/app`. A client user belongs to one or more workspaces through `workspace_members` with role `owner` or `member`. Owners manage billing, connections, API secret, forwarding URL and team; members use the inbox and can view settings.
- **Email tokens** (`email_tokens`, stored as SHA-256) drive email verification (48h), password reset (1h, signs out all sessions) and invitations (7 days, bound to the invited address). Checkout and connecting Pages require a verified email.
- **Plans** live in `src/lib/billing/plans.ts`: Starter 1 Page ($29/mo, $290/yr), Growth 3 ($79/$790), Scale 10 ($199/$1,990), with a 14-day trial (card required, once per workspace). Stripe prices are found by lookup key `oylabs_messaging_<plan>_<month|year>`, created by `scripts/stripe-setup.mjs`.
- **Stripe flow.** The owner picks a plan in `/app/billing`, which opens Stripe Checkout (subscription mode, trial, `workspace_id` metadata). Webhooks to `/api/stripe/webhook` then update the subscription fields on `workspaces`. Each event is applied once (`stripe_events`) and older events are ignored (`stripe_synced_at`). Invoice and checkout events re-fetch the subscription. The success redirect also syncs, so the page is right before the webhook lands. Plan changes, card, invoices and cancellation happen in the Stripe Customer Portal (configuration tagged `metadata.oylabs=messaging`).
- **Service rules** (`src/lib/billing/entitlements.ts`). The service is on when the workspace is complimentary, trialing, active, or past due for at most 7 days. Otherwise the worker holds deliveries (they stay `pending` with no attempts used and go out once billing is active), the Send API returns `402 subscription_inactive`, portal replies are disabled, and new Page connections are refused (`ConnectError('billing')`). Page limits are enforced when a connection is finalised; reconnecting an existing Page is always allowed. Staff can set **complimentary** and a Page-limit override per workspace. Workspaces that existed before billing were migrated to complimentary.

### Stripe setup (test mode first)

1. `STRIPE_SECRET_KEY=sk_test_… APP_BASE_URL=https://oylabs.co node scripts/stripe-setup.mjs`. This creates the products, prices and Customer Portal configuration, and is safe to re-run.
2. Stripe Dashboard → Developers → Webhooks → add `https://oylabs.co/api/stripe/webhook` with the events the script prints; put the signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Stripe settings: customer emails for receipts, failed payments and trial ending; Smart Retries on; public business name `OY Labs Ltd`, support email `hi@oylabs.co`.
4. Local testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI) gives a local `whsec_…`, and test card `4242 4242 4242 4242` completes Checkout.
5. Repeat 1–3 with live keys when going live.

## WhatsApp

- **Connecting** uses Meta's **WhatsApp Embedded Signup** (a Facebook JavaScript SDK pop-up, not our redirect OAuth), in two modes: **Coexistence** (`featureType: whatsapp_business_app_onboarding`) for a number already used in the WhatsApp Business app, and a new API-only number. `completeEmbeddedSignup` exchanges the code for a business integration system-user token, reads the phone number, subscribes our app to the WhatsApp Business Account, registers new numbers with a generated PIN (coexistence numbers are already registered), and for coexistence calls `POST /{phone_number_id}/smb_app_data` twice — `smb_app_state_sync` (contacts) and `history`. Meta allows those two calls once, within 24 hours of onboarding; the Connections page offers a retry if they fail.
- **Webhook fields** subscribed on the WhatsApp Business Account: `messages` (incoming messages and delivery statuses), `smb_message_echoes` (replies sent from the Business app), `smb_app_state_sync` (contact changes), `history` (imported chats), `message_template_status_update`, `account_update`. Everything arrives at the same `/api/meta/webhook` endpoint, is stored one row per item in `webhook_events` (`object = 'whatsapp'`, `account_id` = phone number ID), and is applied by `src/lib/whatsapp/processor.ts`.
- **Identity.** WhatsApp identifies people by a **business-scoped user ID (BSUID)**; the phone number may be missing for people using usernames. Conversations are keyed on the BSUID when present, else the phone, and `findOrCreateWaConversation` upgrades a phone-keyed conversation to its BSUID when one appears. Echoes and history carry phone numbers only, so they match on the phone.
- **History import** keeps only messages inside the retention window (90 days) and dates them by when they were sent, so retention removes them on schedule. If the business declines history sharing, Meta sends error 2593109 and the number shows "History sharing is off".
- **Media** is never stored. `/api/v1/media/{mediaId}` (client API, signed) and `/api/media/{messageId}/{index}` (signed-in staff or workspace member) fetch the URL from Meta with the account token and stream the file.
- **Sending** (`src/lib/whatsapp/send.ts`): free-form text and media need the 24-hour customer service window; an approved template can be sent at any time, including to a phone number with no conversation, which creates one. Bodies carry both `to` (phone) and `recipient` (BSUID) when known.
- **Templates** (`src/lib/whatsapp/templates.ts`) mirror Meta's per-WABA templates in `wa_templates`. The portal can create, edit and delete them; media headers upload an example file through the Resumable Upload API to get the `header_handle`. Approval decisions arrive on the `message_template_status_update` webhook.
- **Plan limits** count *channels*: connected Pages plus connected WhatsApp numbers (`activeChannelCount`).
- **Token lifetime.** Meta's WhatsApp Embedded Signup template issues 60-day tokens. The expiry is recorded at signup (`wa_numbers.token_expires_at`); the hourly worker emails workspace owners 7 days before, and marks the number *Reconnect needed* once it lapses. Reconnecting the same number resets the clock and keeps its history.
- **Meta bills the business directly** for WhatsApp messages; OY Labs neither pays nor marks up those fees.

## Meta app (OY Labs Messaging)

- App ID `2626971604401918`, business portfolio OY LABS LTD (`100100196329006`). Use cases: Messenger, Instagram (messaging), WhatsApp.
- Login for Business configurations: **Pages and Instagram** `1717528022693255` (user token; pages_show_list, pages_manage_metadata, pages_messaging, pages_read_engagement, instagram_basic, instagram_manage_messages, business_management) → `META_LOGIN_CONFIG_ID`; **WhatsApp Embedded Signup** `1487124386534713` (system-user token, 60 days) → `META_WA_CONFIG_ID`.
- Webhooks are registered by `node --env-file=.env.production scripts/meta-setup.mjs` on the server (Page, Instagram and WhatsApp Business Account objects). It checks the app secret and the handshake first; `--check` only reports.
- The running app reads `.next/standalone/.env.production`, which `deploy.sh` links to `/var/www/oylabs/.env.production` — edit the real file, then restart.

## Code map

| Path | Purpose |
|---|---|
| `src/lib/messaging/env.ts` | Configuration access, `metaConfigured()` |
| `src/lib/messaging/db.ts` | SQLite connection + migrations |
| `src/lib/messaging/crypto.ts` | AES-GCM, random tokens, hashing |
| `src/lib/messaging/signatures.ts` | Meta webhook signature, client HMAC, `signed_request` |
| `src/lib/messaging/graph.ts` | Graph API client (`appsecret_proof`, typed errors) |
| `src/lib/messaging/connections.ts` | Connect links, OAuth, Page selection, disconnect |
| `src/lib/messaging/events.ts` | Webhook intake and dedupe |
| `src/lib/messaging/processor.ts` | Routing, conversations/messages, profile lookup, queue forward |
| `src/lib/messaging/deliveries.ts` | Signed forwarding, backoff, dead letters, test event |
| `src/lib/messaging/send.ts` | Outbound messages: validation, window rules, idempotency |
| `src/lib/messaging/deletion.ts` | Data deletion + deauthorize callbacks, staff deletion |
| `src/lib/messaging/worker.ts` | Worker loop, retention purge |
| `src/lib/auth/*` | Password hashing, sessions |
| `src/app/api/meta/*` | Webhook, OAuth start/callback, data deletion, deauthorize |
| `src/app/api/v1/messages` | Client Send API |
| `src/lib/accounts/accounts.ts` | Client users, sign-up, verification, password reset, team and invites |
| `src/lib/auth/client-session.ts` | Client sessions and guards (`requireClient`, `assertClient`) |
| `src/lib/billing/*` | Plans, service rules, Stripe Checkout/Portal/webhook sync |
| `src/lib/whatsapp/*` | Embedded Signup, WhatsApp webhooks, sending, templates, media streaming |
| `src/components/whatsapp/*` | Connect button (Embedded Signup), number list, template editor and send form |
| `src/app/(auth)/*` | `/login`, `/signup`, password reset, email verification, invites |
| `src/app/app/*` | Client portal: overview, inbox, connections, developers, team, billing, settings |
| `src/app/pricing`, `src/app/developers/messaging-api` | Public pricing page and API guide (rendered from `docs/client-integration.md`) |
| `src/components/messaging/*` | Inbox, connection list, delivery log and developer forms shared by console and portal |
| `src/app/console/*` | Staff console (overview, workspaces, inbox; `/console/login`) |
| `src/app/connect/*` | Client connect flow |
| `src/app/{tech-provider,privacy,terms,data-deletion}` | Public pages |

## Environment variables

Set in `.env.production` on the server (and `.env.development.local` locally). Restart after changes.

| Variable | Required | Example / how to generate | Notes |
|---|---|---|---|
| `TOKEN_ENCRYPTION_KEY` | yes | `openssl rand -base64 32` | **Never change after tokens are stored.** Losing it means every Page must reconnect and every client secret be rotated. Back it up in a password manager. |
| `META_APP_ID` | yes | from App Dashboard → Basic | |
| `META_APP_SECRET` | yes | from App Dashboard → Basic | Secret |
| `META_VERIFY_TOKEN` | yes | `openssl rand -hex 24` | Same value in Webhooks config |
| `META_LOGIN_CONFIG_ID` | yes | Login for Business configuration ID | |
| `APP_BASE_URL` | yes in prod | `https://oylabs.co` | Used for OAuth redirect URI, connect links, deletion status URLs |
| `META_GRAPH_VERSION` | no | `v26.0` (default) | Bump deliberately after reading Meta's changelog |
| `META_HUMAN_AGENT_APPROVED` | no | `true` | Only after Meta approves Human Agent |
| `MESSAGING_DB_PATH` | no | `data/messaging.db` (default) | |
| `MESSAGE_RETENTION_DAYS` | no | `90` (default) | Must match the privacy policy |
| `MESSAGING_WORKER` | no | `off` | Disables the background worker |
| `STRIPE_SECRET_KEY` | for billing | `sk_test_…` / `sk_live_…` | Without it, clients can sign up but not subscribe |
| `STRIPE_WEBHOOK_SECRET` | for billing | `whsec_…` from the Stripe webhook endpoint | |
| `META_WA_CONFIG_ID` | for WhatsApp | The WhatsApp Embedded Signup configuration ID | Without it the WhatsApp buttons are hidden |
| `RESEND_API_KEY` | yes in prod | Resend dashboard | Account emails (verify, reset, invites) and the contact form. Locally, links are printed to the server log instead. |

Until the five required Meta/encryption variables are set, the public pages and console work, but `/api/meta/*` and `/api/v1/messages` return 503 and the console shows a banner.

## Running locally

```bash
npm ci
cat > .env.development.local <<'ENV'
META_APP_ID=100000000000001
META_APP_SECRET=local-test-app-secret
META_VERIFY_TOKEN=local-verify-token
META_LOGIN_CONFIG_ID=200000000000002
TOKEN_ENCRYPTION_KEY=<openssl rand -base64 32>
APP_BASE_URL=http://localhost:3000
ENV
npm run dev                                   # creates data/messaging.db on start
node scripts/create-staff-user.mjs --email you@oylabs.co --name "You"
```

Then sign in at http://localhost:3000/console/login (staff) or sign up at http://localhost:3000/signup (client; the verification link is printed in the server log when `RESEND_API_KEY` is unset). Real Facebook Login needs a real app and an HTTPS redirect URI. Locally you can exercise webhooks by signing payloads with `META_APP_SECRET` (see `test/webhook-processing.test.ts` for shapes). Forwarding URLs may be `http://localhost` only outside production.

Checks before committing: `npm test`, `npx tsc --noEmit`, `npx eslint <changed paths>` (the repo has pre-existing lint errors in older files), `npm run build`.

## Deploying (server: /var/www/oylabs)

Ask before deploying. Steps:

1. Server working tree: before the first `git pull` of this branch, the server's untracked/modified files must match git (commit `85bb115` captured them). `git status` on the server should show only `DEPLOY.md`, `next.config.ts` etc. as modified with identical content; run `git stash push -m pre-meta-deploy` (or `git checkout -- .` after confirming the diff is empty) so `git pull` can fast-forward.
2. Add the env vars above to `/var/www/oylabs/.env.production`, then `chmod 600 .env.production`. **Only `.env.production` is available at runtime**: the standalone build copies it, but not `.env.local`. For the same reason, move `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` from `.env.local` into `.env.production`. Right now the live contact form fails with "Missing API key" and Turnstile verification is skipped.
3. `./deploy.sh`. It now also backs up `data/messaging.db` using SQLite's online backup.
4. Create staff logins: `cd /var/www/oylabs && node scripts/create-staff-user.mjs --email … --name …` (after the app has started once). Staff sign in at `/console/login`.
5. The old `NEXT_PUBLIC_ADMIN_PIN` is no longer used; remove it from `.env.production` and `.env.local`.
6. Verify: `/tech-provider`, `/pricing`, `/privacy`, `/terms`, `/data-deletion`, `/signup`, `/login`, `/console/login`; `curl "https://oylabs.co/api/meta/webhook?hub.mode=subscribe&hub.verify_token=$META_VERIFY_TOKEN&hub.challenge=ok"` returns `ok`.

Nginx needs no change (everything is under the existing `location /` proxy). Keep `client_max_body_size` ≥ 1m for webhooks.

## Operations

- **Health:** console Overview shows last webhook time, failed deliveries, unprocessable events and connections needing reconnect.
- **Reconnect needed:** Meta returned error 190 (token invalid) on a send or profile lookup. Create a new connect link for a Page admin. Reconnecting the same Page keeps its history.
- **Dead deliveries:** check the client endpoint, then **Retry** on the workspace page.
- **Failed events:** `webhook_events.status = 'failed'` after 5 attempts. Query `last_error` with `sqlite3`/node to diagnose. They are purged after 14 days.
- **Deletion requests by email:** open the conversation in the inbox → **Delete data** → send the requester the confirmation code shown. Status is checkable at `/data-deletion/status`.
- **Retention:** runs hourly in the worker (see `purgeExpiredData`), matching `/privacy`.
- **Backups:** `/var/backups/oylabs/messaging.db.<timestamp>` on each deploy. They contain encrypted tokens and plaintext messages, so treat them as sensitive and prune older than 30 days.
