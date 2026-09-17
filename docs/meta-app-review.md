# Meta App Review: permission justifications and screencast scripts

App: **OY Labs Messaging** (Business app, owned by the OY Labs Ltd portfolio).
Reviewer instructions, justification text and screencast scripts for each permission. Paste the justification text as-is; adjust only if Meta's form asks something different.

## Reviewer notes (paste into "App verification details")

> OY Labs Ltd provides a messaging integration to client businesses. A client's Facebook Page admin connects their Page and its linked Instagram professional account using Facebook Login for Business. OY Labs then receives the messages customers send to that Page on Messenger and to that Instagram account, delivers them to the client's own inbox system, and sends the client's staff replies back through the Send API. Client businesses sign up at https://oylabs.co/signup and manage everything in their own account at https://oylabs.co/app (connections, inbox with reply box, team, API keys and billing), which is what the screencasts use.
>
> Test access: sign in at https://oylabs.co/login with **reviewer@oylabs.co / <password>**. The account "OY Labs Demo" has the test Page **<Page name>** and Instagram account **@<username>** connected (billing is not required for this account). To test receiving: message that Page or Instagram account from any account with a role on the app, then open **Inbox**. To test replying: open the conversation and use the reply box within 24 hours of the message. To test connecting: open **Connections** and click **Connect Facebook & Instagram**.
>
> Privacy policy: https://oylabs.co/privacy · Terms: https://oylabs.co/terms · Data deletion instructions: https://oylabs.co/data-deletion · Service description: https://oylabs.co/tech-provider

## Screencast A: connect a Page (covers pages_show_list, business_management, pages_manage_metadata, instagram_basic, pages_read_engagement)

Record at 1280×800 or larger, English UI, with captions or a voice-over naming each step. About 2 minutes.

1. Show https://oylabs.co/tech-provider briefly: "This is the OY Labs messaging integration."
2. Go to https://oylabs.co/login and sign in with the demo client account.
3. Open **Connections** (show "Nothing connected yet").
4. Click **Connect Facebook & Instagram**.
5. On the connect page, scroll through "What OY Labs can access". Click **Continue with Facebook**.
6. Facebook Login for Business dialog: show the business being selected, **the Page being ticked**, the Instagram account, and the **permissions list**. Click through to approve.
7. Back on "Choose the Page to connect": point out that this list comes from `pages_show_list`, and that the Instagram username shown for each Page comes from `instagram_basic`. Select the Page, click **Connect Page**.
8. "Connected" page → **Go to your OY Labs account** → **Connections**: the Page shows **Active** with its Page ID and the linked **@instagram** username. Say: "OY Labs subscribed this Page to message webhooks using `pages_manage_metadata`."
9. Click **Disconnect** on a *second* test Page (or at the end of screencast B) to show unsubscribing and token deletion.

## Screencast B: receive and reply on Messenger (covers pages_messaging)

1. Split screen: left, Messenger (web or app) signed in as a test customer account with a role on the app; right, the OY Labs account **Inbox** (https://oylabs.co/app/inbox).
2. Customer sends to the Page: "Hello, do you have space in Saturday's class?"
3. Within seconds the conversation appears in the inbox, with the customer's name and picture. Open it.
4. Type a reply in the reply box: "Yes — we have two places left. Would you like to book?" → **Send**.
5. Show the reply arriving in the customer's Messenger.
6. Point at the window indicator ("Standard messaging window open · closes …") and say replies are only allowed within Meta's 24-hour window.

## Screencast C: receive and reply on Instagram (covers instagram_manage_messages, instagram_basic)

1. Show the Instagram professional account's **Settings → Messages and story replies → Message controls → Connected tools → Allow access to messages** turned on.
2. Split screen: Instagram app/web as the test customer; the OY Labs account inbox.
3. Customer sends a DM to the business account: "Hi! Do you offer lessons online?"
4. Conversation appears in the inbox with the **Instagram** badge and "via @username". Open it.
5. Reply from the inbox; show it arriving in the customer's Instagram DMs.

## Screencast D (optional but recommended): data deletion

1. As the test Page admin, open Facebook **Settings & privacy → Settings → Business integrations**, remove **OY Labs Messaging**.
2. **Connections** in the OY Labs account shows the Page as **Disconnected**.
3. Open https://oylabs.co/data-deletion and show the instructions and the status checker.

---

## Permission justifications

Use the "How will your app use this permission?" box. Each links to the screencast above.

### pages_show_list
> After a client business's Page admin signs in with Facebook Login for Business, OY Labs lists the Pages they granted so they can choose which Page to connect to their inbox. We read only the Page ID, name and linked Instagram account for that list. Without this permission the admin could not select the Page. Shown in screencast A, step 7.

### business_management
> Meta requires this permission alongside pages_show_list and pages_messaging for Business apps. OY Labs uses it only to read the client business portfolio ID that the connection belongs to (so each connection is tied to the correct client business) and the assets that business granted during Facebook Login for Business. We do not create, edit or manage anything in the client's business portfolio. Shown in screencast A, step 6.

### pages_manage_metadata
> When a client connects a Page, OY Labs subscribes that Page to our app's webhooks (POST /{page-id}/subscribed_apps for messages, messaging_postbacks and message_echoes) so new customer messages are delivered to us in real time, and unsubscribes it when the client disconnects. We do not change any other Page settings. Shown in screencast A, step 8, and the Disconnect action.

### pages_read_engagement
> Used while connecting a Page to read the Page's basic information (name and the linked Instagram professional account) returned with the granted Pages, so the admin sees the correct Page and Instagram account before connecting and our staff see which account is connected. We don't read posts, comments, followers or insights. Shown in screencast A, steps 7–8.

### pages_messaging
> Customers message our client businesses' Facebook Pages on Messenger. OY Labs receives those messages via webhooks, delivers them to the client's own inbox system, and sends the replies written by the client's staff back to the customer through the Send API, only within Meta's 24-hour standard messaging window. We never send marketing or unsolicited messages and never start conversations. We also look up the customer's name and profile picture to label the conversation for staff. Shown in screencast B.

### instagram_basic
> Used to read the ID and username of the Instagram professional account linked to the connected Page, so incoming Instagram messages are routed to the right client business and staff can see which account a conversation belongs to. We don't read media, followers or insights. Shown in screencast A, steps 7–8, and screencast C, step 4.

### instagram_manage_messages
> Customers send Direct messages to our client businesses' Instagram professional accounts. OY Labs receives those messages via webhooks, delivers them to the client's own inbox, and sends the replies written by the client's staff back to the customer, within Meta's messaging window. We also read the customer's name/username and profile picture to label the conversation. No automated promotional messages. Shown in screencast C.

### Human Agent (optional feature)
> Some customer questions to our client businesses (for example about enrolment or schedules) need a staff member to check information and can't always be answered within 24 hours. With Human Agent, a staff member can reply manually up to 7 days after the customer's last message. Replies are always typed by a person in the client's inbox; never automated or promotional.

## Data handling answers (Data Use Checkup / questionnaire)

| Question | Answer |
|---|---|
| Do you share Platform Data with third parties? | Only with the client business that owns the connected Page/Instagram account (the business the customer messaged), and with our hosting sub-processor (Amazon Web Services). Stripe processes subscription payments only and receives no Platform Data. |
| Do you use data for advertising or sell it? | No. |
| Retention | Messages and profile data 90 days; raw webhook events 14 days; delivery logs 30 days; tokens until disconnect or deletion. |
| Security | TLS in transit; tokens and client secrets encrypted with AES-256-GCM at rest; webhook signatures verified (X-Hub-Signature-256); appsecret_proof on Graph calls; staff console behind individual accounts with scrypt-hashed passwords; no message content in logs. |
| Deletion | Data Deletion Callback at https://oylabs.co/api/meta/data-deletion, status page https://oylabs.co/data-deletion/status, email hi@oylabs.co. |
| Responsible entity | OY Labs Ltd, 71-75 Shelton Street, Covent Garden, London WC2H 9JQ, United Kingdom. |
