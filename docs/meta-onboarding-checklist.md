# Meta onboarding checklist: OY Labs as a Messenger & Instagram tech provider

Ordered steps to get from "code deployed" to "Minhaj Kids receiving messages". Meta renames screens often; if a label below doesn't match, search the Meta Help Center for the step name.

Legend: **[You]** needs a human with account access or documents · **[Deploy]** server change (ask before running) · **[Done in code]** already built.

---

## 0. Before you start

- [ ] **[You]** Buy the business phone number. Business Verification can confirm by phone, and it should match the details you submit. Add it to the site footer afterwards (tell me the number).
- [ ] **[You]** Pay the ICO data protection fee for OY Labs Ltd (https://ico.org.uk/for-organisations/data-protection-fee/). Processing client customers' messages makes OY Labs a data processor, and its own contact/staff data makes it a controller.
- [ ] **[You]** Have ready: Certificate of Incorporation for OY Labs Ltd, and a document showing the registered address *71-75 Shelton Street, Covent Garden, London WC2H 9JQ* (e.g. Companies House record, virtual-office agreement, utility or bank letter in the company name).
- [ ] **[You]** Make sure `hi@oylabs.co` is monitored. It's the contact on the privacy policy, terms and connect pages, and Meta may email it.

## 1. Deploy the pages and system  — [Deploy]

Meta checks these URLs during setup and review, so they must be live on https://oylabs.co first.

- [ ] Push branch `feat/meta-tech-provider` and deploy (see `docs/messaging-system.md` → *Deploying*). I'll do this once you approve.
- [ ] Generate and set env vars in `/var/www/oylabs/.env.production`: `TOKEN_ENCRYPTION_KEY`, `META_VERIFY_TOKEN`, `APP_BASE_URL=https://oylabs.co` now; the `META_APP_*` values after step 3.
- [ ] Create your console login on the server: `node scripts/create-staff-user.mjs --email you@oylabs.co --name "…"`. Staff sign in at `/console/login`.
- [ ] WhatsApp: add the **WhatsApp** product to the Meta app, create a **Facebook Login for Business** configuration for WhatsApp Embedded Signup (permissions `whatsapp_business_management`, `whatsapp_business_messaging`, `business_management`), and put its ID in `META_WA_CONFIG_ID`.
- [ ] WhatsApp webhooks: subscribe the app to `messages`, `smb_message_echoes`, `smb_app_state_sync`, `history`, `message_template_status_update` and `account_update` on the WhatsApp Business Account object, pointing at the same `/api/meta/webhook` URL and verify token.
- [ ] Stripe (can be test mode during Meta review): run `scripts/stripe-setup.mjs`, add the webhook endpoint, and set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (see `docs/messaging-system.md` → Billing).
- [ ] Move `RESEND_API_KEY` into `.env.production` so sign-up confirmation, password reset and invite emails are sent.
- [ ] Check: https://oylabs.co/tech-provider, /pricing, /privacy, /terms, /data-deletion, /signup, /login all load.

## 2. Business portfolio, domain, Business Verification — [You]

1. [ ] Meta Business Suite → **Settings** (business.facebook.com/settings). Create or confirm the **OY Labs Ltd** business portfolio. Legal name exactly `OY Labs Ltd`, address as above, website `https://oylabs.co`, business email `hi@oylabs.co`.
2. [ ] **Brand safety → Domains → Add** `oylabs.co` → choose **DNS TXT record** → add the TXT record at the DNS provider for oylabs.co (Google verification TXT records already exist there; add Meta's alongside, don't replace them) → **Verify**. *(DNS change: tell me if you want me to prepare the exact record once Meta shows it.)*
3. [ ] **Security Center → Business verification → Start verification**. Enter legal name, address, phone, website; upload the documents from step 0; confirm via email to `hi@oylabs.co` (domain-verified email is fastest) or phone.
4. [ ] Wait for approval (typically a few days, sometimes 2+ weeks). Continue with 3–4 in parallel.

## 3. Create the Meta app — [You]

1. [ ] developers.facebook.com → **My Apps → Create app**. Choose the use cases for managing messaging on Messenger and Instagram (the **Business** app type). App name e.g. `OY Labs Messaging`, contact email `hi@oylabs.co`, **Business portfolio: OY Labs Ltd**.
2. [ ] **App settings → Basic**:
   - App domains: `oylabs.co`
   - Privacy policy URL: `https://oylabs.co/privacy`
   - Terms of service URL: `https://oylabs.co/terms`
   - User data deletion: **Data deletion callback URL** `https://oylabs.co/api/meta/data-deletion`
   - App icon (1024×1024): use `public/logo-1024.png`
   - Category: Business and pages (or closest messaging category)
   - Copy **App ID** and **App secret** → give them to me for `META_APP_ID` / `META_APP_SECRET` (or paste them into the server env yourself).
3. [ ] **App settings → Advanced**: turn on **Require app secret** (the code sends `appsecret_proof` on every call).
4. [ ] Add products: **Facebook Login for Business**, **Messenger**, **Instagram** (the "API setup with Facebook login" flavour, *not* "Instagram Login"), **Webhooks**.

## 4. Configure products — [You], values from the console

The console's **Overview → Meta app settings** card shows every URL below with copy buttons.

- [ ] **Facebook Login for Business → Settings**
  - Valid OAuth redirect URIs: `https://oylabs.co/api/meta/oauth/callback`
  - Deauthorize callback URL: `https://oylabs.co/api/meta/deauthorize`
  - Client OAuth login and Web OAuth login: on; Enforce HTTPS: on; Use Strict Mode for redirect URIs: on
- [ ] **Facebook Login for Business → Configurations → Create configuration**
  - Name: `OY Labs messaging connect`
  - Login variation: **General**
  - Access token: **System-user access token** (business integration system user), expiration **Never**
  - Assets: **Pages** (and Instagram accounts if offered)
  - Permissions: `pages_show_list`, `pages_manage_metadata`, `pages_messaging`, `pages_read_engagement`, `business_management`, `instagram_basic`, `instagram_manage_messages`, nothing else
  - Copy the **Configuration ID** → `META_LOGIN_CONFIG_ID`
- [ ] **Webhooks** (or Messenger → Settings → Webhooks, and Instagram → Webhooks)
  - Object **Page**: callback `https://oylabs.co/api/meta/webhook`, verify token = `META_VERIFY_TOKEN` → Verify and save → subscribe fields `messages`, `messaging_postbacks`, `message_echoes`
  - Object **Instagram**: same callback and token → subscribe `messages`, `messaging_postbacks`
- [ ] **[Deploy]** Put `META_APP_ID`, `META_APP_SECRET`, `META_LOGIN_CONFIG_ID` in the server env and restart. The console's yellow "Meta isn't configured" banner disappears.

## 5. Test end-to-end in Development mode — [You] + me

In Development mode only people with a role on the app can connect.

- [ ] App Dashboard → **App roles → Roles**: add yourself (and whoever administers Minhaj's Page) as Admin/Tester.
- [ ] Use a test Facebook Page you administer, with a linked Instagram professional account (or Minhaj's Page if you are its admin).
- [ ] Sign up at `/signup` as a demo client ("OY Labs Demo"), confirm the email, then in the console mark that workspace **Complimentary** (or start a Stripe test-mode trial with card 4242 4242 4242 4242). In the client portal → **Connections** → **Connect Facebook & Instagram** → finish the flow → the Page shows **Active**.
- [ ] WhatsApp test: connect a WhatsApp number (Coexistence if it is already in the WhatsApp Business app), message it from another phone, reply from the OY Labs inbox, and check a reply sent from the WhatsApp Business app also appears in the inbox.
- [ ] Create one message template in **Templates**, wait for WhatsApp's approval, and send it to a number outside the 24-hour window.
- [ ] From another Facebook account (also with an app role), message the Page and the Instagram account → both conversations appear in the portal **Inbox** within seconds → reply there → the reply arrives in Messenger/Instagram.
- [ ] Remove the app in that test user's Facebook settings → check the data deletion / deauthorize callbacks work (connection shows Disconnected; a confirmation code resolves at /data-deletion/status).
- [ ] Record the App Review screencasts now (scripts in `docs/meta-app-review.md`).

> Things to confirm during this test (Meta behaviour I couldn't verify without a real app): (a) `/me/accounts` with the business-integration system-user token lists the granted Pages with Page tokens; if it returns empty, switch the Login configuration's token type to **User access token**, which the code also supports. (b) The `user_id` in Meta's data-deletion callback matches the ID we store at connection time. If it doesn't, deletion requests still return a valid code with status "no data", and we handle them by email.

## 6. Access Verification (tech provider) — [You]

Required because OY Labs accesses *other* businesses' data.

- [ ] App Dashboard → **App Review → Requests** (or the "Access verification" prompt). Complete the questionnaire:
  - *Business model:* OY Labs Ltd is a software company that connects client businesses' Facebook Pages and linked Instagram professional accounts to the clients' own customer inbox systems so their staff can answer customer messages.
  - *Whose data:* only the client businesses' own Pages/Instagram accounts and the messages customers send them.
  - *How clients onboard:* a client Page admin authorises via Facebook Login for Business using a single-use link; the client can disconnect at any time.
  - *Data use:* delivering messages to the client's inbox and sending the client's replies; no ads, no resale, no profiling; tokens encrypted; messages kept 90 days.
- [ ] Business Verification (step 2) must be approved for this to complete.

## 7. App Review for Advanced Access — [You]

- [ ] App Review → **Permissions and features** → request **Advanced Access** for each permission in the Login configuration, with the justifications and screencasts from `docs/meta-app-review.md`.
- [ ] Also request **Human Agent** only if you want 7-day replies (optional; set `META_HUMAN_AGENT_APPROVED=true` after approval).
- [ ] Reviewer test access: create a client account for the reviewer (sign up as `reviewer@oylabs.co`, or invite that address as owner to the demo workspace from the console), mark the workspace Complimentary so billing never blocks the review, give the credentials in the review notes, and keep the test Page connected.
- [ ] Submit and answer reviewer questions quickly (they time out).

## 8. Go live and connect Minhaj Kids

- [ ] App Dashboard → **App mode: Live**.
- [ ] **[You]** Minhaj builds its receiving endpoint per `docs/client-integration.md`.
- [ ] Minhaj's WhatsApp: connect its existing WhatsApp Business app number through Coexistence so the phone keeps working and events forward with `channel: "whatsapp"`.
- [ ] Console → **New workspace** "Minhaj Kids" (Complimentary, Page limit as needed), forwarding URL = Minhaj's endpoint → copy API key/secret into Minhaj's env (`OYLABS_API_KEY`, `OYLABS_API_SECRET`) → **Send signed test event** returns 2xx. Optionally invite Minhaj's admin as owner so they can use the portal.
- [ ] **Create connect link** → a full admin of Minhaj's Page opens it and connects → Minhaj's Instagram owner enables *Allow access to messages*.
- [ ] Message Minhaj's Page and Instagram from a personal account → arrives in Minhaj's inbox → reply from Minhaj → arrives in Messenger/Instagram.

---

## Everything that needs you (not code)

| # | Action | Where |
|---|---|---|
| 1 | Buy business phone number | provider of choice |
| 2 | Pay ICO data protection fee | ico.org.uk |
| 3 | Gather incorporation + address documents | Companies House / office provider |
| 4 | Approve deployment and env changes | tell me |
| 5 | Business portfolio details | business.facebook.com/settings |
| 6 | Add Meta domain-verification TXT record for oylabs.co | DNS provider |
| 7 | Business Verification submission | Security Center |
| 8 | Create Meta app, copy App ID/secret | developers.facebook.com |
| 9 | Login for Business configuration, copy config ID | App Dashboard |
| 10 | Webhooks for Page and Instagram | App Dashboard |
| 11 | App roles for testers | App Dashboard |
| 12 | Test Page + Instagram professional account for demos | Facebook/Instagram |
| 13 | Record screencasts | your screen recorder |
| 13b | Stripe account: run setup script (test then live), webhook endpoint, email/retry settings, public business details | dashboard.stripe.com |
| 13d | WhatsApp: add the product, create the Embedded Signup configuration, subscribe the extra webhook fields | developers.facebook.com |
| 13e | Tell each client to add their own payment method in WhatsApp Manager (Meta bills them for WhatsApp messages) | business.facebook.com |
| 13c | Decide with your accountant whether VAT applies; enable Stripe Tax if so | accountant / Stripe |
| 14 | Access Verification questionnaire | App Dashboard |
| 15 | App Review submission | App Dashboard |
| 16 | Switch app to Live | App Dashboard |
| 17 | Minhaj Page admin opens connect link; enables IG message access | Minhaj |

Useful links: Tech providers https://developers.facebook.com/docs/development/release/tech-providers · Business verification https://www.facebook.com/business/help/2058515294227817 · Login for Business https://developers.facebook.com/docs/facebook-login/facebook-login-for-business · Messenger Platform https://developers.facebook.com/docs/messenger-platform · Instagram messaging https://developers.facebook.com/docs/messenger-platform/instagram · Webhooks https://developers.facebook.com/docs/messenger-platform/webhooks · Data deletion callback https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
