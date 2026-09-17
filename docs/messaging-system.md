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
| `src/app/console/*` | Staff console (overview, workspaces, inbox) |
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

Then sign in at http://localhost:3000/login. Real Facebook Login needs a real app and an HTTPS redirect URI. Locally you can exercise webhooks by signing payloads with `META_APP_SECRET` (see `test/webhook-processing.test.ts` for shapes). Forwarding URLs may be `http://localhost` only outside production.

Checks before committing: `npm test`, `npx tsc --noEmit`, `npx eslint <changed paths>` (the repo has pre-existing lint errors in older files), `npm run build`.

## Deploying (server: /var/www/oylabs)

Ask before deploying. Steps:

1. Server working tree: before the first `git pull` of this branch, the server's untracked/modified files must match git (commit `85bb115` captured them). `git status` on the server should show only `DEPLOY.md`, `next.config.ts` etc. as modified with identical content; run `git stash push -m pre-meta-deploy` (or `git checkout -- .` after confirming the diff is empty) so `git pull` can fast-forward.
2. Add the env vars above to `/var/www/oylabs/.env.production`, then `chmod 600 .env.production`. **Only `.env.production` is available at runtime**: the standalone build copies it, but not `.env.local`. For the same reason, move `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` from `.env.local` into `.env.production`. Right now the live contact form fails with "Missing API key" and Turnstile verification is skipped.
3. `./deploy.sh`. It now also backs up `data/messaging.db` using SQLite's online backup.
4. Create staff logins: `cd /var/www/oylabs && node scripts/create-staff-user.mjs --email … --name …` (after the app has started once).
5. The old `NEXT_PUBLIC_ADMIN_PIN` is no longer used; remove it from `.env.production` and `.env.local`.
6. Verify: `/tech-provider`, `/privacy`, `/terms`, `/data-deletion`, `/login`; `curl "https://oylabs.co/api/meta/webhook?hub.mode=subscribe&hub.verify_token=$META_VERIFY_TOKEN&hub.challenge=ok"` returns `ok`.

Nginx needs no change (everything is under the existing `location /` proxy). Keep `client_max_body_size` ≥ 1m for webhooks.

## Operations

- **Health:** console Overview shows last webhook time, failed deliveries, unprocessable events and connections needing reconnect.
- **Reconnect needed:** Meta returned error 190 (token invalid) on a send or profile lookup. Create a new connect link for a Page admin. Reconnecting the same Page keeps its history.
- **Dead deliveries:** check the client endpoint, then **Retry** on the workspace page.
- **Failed events:** `webhook_events.status = 'failed'` after 5 attempts. Query `last_error` with `sqlite3`/node to diagnose. They are purged after 14 days.
- **Deletion requests by email:** open the conversation in the inbox → **Delete data** → send the requester the confirmation code shown. Status is checkable at `/data-deletion/status`.
- **Retention:** runs hourly in the worker (see `purgeExpiredData`), matching `/privacy`.
- **Backups:** `/var/backups/oylabs/messaging.db.<timestamp>` on each deploy. They contain encrypted tokens and plaintext messages, so treat them as sensitive and prune older than 30 days.
