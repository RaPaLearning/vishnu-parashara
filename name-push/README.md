# name-push — backend for "next name" push notifications

Cloudflare Worker backend for the Vishnu Sahasranama frontend. It keeps track
of the name each **device** (browser install, identified by a random `deviceId`
stored in `localStorage` — no user accounts) is currently showing, and pushes a
notification containing the **next name** whenever the device has been idle for
**15 minutes**.

How it works:

- The frontend registers the device (`POST /register`) when the user turns the
  **"Setup name reminders"** toggle on. It also uploads the full list of names
  (`number`, `word`, `meaning`) once, so the worker can compose notifications.
- The frontend reports the current name (`POST /state`) **whenever it changes**,
  and sends a lightweight heartbeat (`POST /activity`, throttled to every 5
  minutes) when the user taps the page without changing names. Each of these
  resets the 15-minute idle timer.
- A **cron trigger runs every minute**. When a device's idle timer has expired,
  the worker pushes a notification with the next name (`currentIndex + 1`,
  wrapping around at the end) and advances the stored index — so notifications
  keep arriving every 15 minutes until the user interacts again.
- Each notification has a **"Next name"** button. Tapping it makes the service
  worker call `POST /advance`, which moves that device to the next name and
  shows a fresh notification. Tapping the notification body itself opens the
  page at that name (`?name=<flat index>`).
- When the page is (re)opened while reminders are on, it asks the worker for
  the device's current index (`GET /state`) and follows any advances that
  happened while it was closed.

Storage is Cloudflare KV (`NAMES_KV`): one `device:<deviceId>` record per
device, plus a shared `data:names` list.

The worker has **no runtime npm dependencies**: Web Push (RFC 8291 `aes128gcm`
encryption + RFC 8292 VAPID JWT signing) is implemented from scratch in
`src/webpush.js` using the WebCrypto and fetch APIs available in Workers. You
can verify the implementation with `npm run test-webpush` (encrypt → decrypt
round-trip plus JWT signature check, runs on Node 19+).

API summary (all JSON, CORS enabled):

| Method | Path                | Body / query                                     | Purpose |
|--------|---------------------|--------------------------------------------------|---------|
| GET    | `/`                 | –                                                | health check |
| GET    | `/vapid-public-key` | –                                                | VAPID public key for `pushManager.subscribe` |
| POST   | `/register`         | `{ deviceId, subscription?, enabled, currentIndex?, apiBase?, names? }` | register/update device (+ names list) |
| POST   | `/state`            | `{ deviceId, currentIndex }`                     | report current name, reset idle timer |
| POST   | `/activity`         | `{ deviceId }`                                   | heartbeat, reset idle timer |
| GET    | `/state`            | `?deviceId=...`                                  | read device's current index |
| POST   | `/advance`          | `{ deviceId }`                                   | move to next name (used by notification's "Next" button) |
| POST   | `/test-push`        | `{ deviceId }`                                   | send a test push immediately (verifies subscription) |

---

## Hosting on Cloudflare — step by step

All commands below are run from this `name-push/` folder. You need a free
[Cloudflare account](https://dash.cloudflare.com/sign-up) and
[Node.js](https://nodejs.org/).

### 1. Install dependencies

```bash
npm install
```

### 2. Log in to Cloudflare

```bash
npx wrangler login
```

### 3. Create the KV namespace

```bash
npx wrangler kv namespace create NAMES_KV
```

Copy the `id` printed by that command into `wrangler.jsonc`
(`kv_namespaces[0].id`).

### 4. Generate VAPID keys and store them as secrets

Web Push requires a VAPID key pair (generate **once** and reuse):

```bash
npm run generate-keys
npx wrangler secret put VAPID_PUBLIC_KEY    # paste the public key
npx wrangler secret put VAPID_PRIVATE_KEY   # paste the private key
```

### 5. Deploy

```bash
npm run deploy
```

Wrangler prints the worker URL, e.g.
`https://vishnu-name-push.<your-subdomain>.workers.dev`. Verify it:

```bash
curl https://vishnu-name-push.<your-subdomain>.workers.dev/
# {"ok":true,"service":"name-push"}
```

### 6. Point the frontend at the worker

Open `frontend/src/push/reminders.js` and set `DEFAULT_API_BASE` to your
worker URL (or, without rebuilding, run in the browser console on the app
page once:

```js
localStorage.setItem('namePushApiBase', 'https://vishnu-name-push.<your-subdomain>.workers.dev');
```

).

### 7. Test it

- Deploy the frontend and open the page.
- Click the bell toggle ("Setup name reminders") and grant notification
  permission.
- Navigate a couple of names (the backend now tracks your position), then
  leave the page alone for 15 minutes. A notification with the next name
  should arrive; "Next name" advances again, tapping the body reopens the
  page at that name.

Local development instead of deploy:

```bash
npx wrangler dev             # serves on http://localhost:8787
npx wrangler dev --test-scheduled   # exposes /__scheduled to trigger the cron manually
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

Logs from the deployed worker: `npm run tail`.

---

## Notes, limits, and behavior details

- **Idle semantics.** "Idle" means no name change and no heartbeat from that
  device. While the page is open and you are actively tapping (with names
  changing), notifications are suppressed. While the page is closed or
  in the background, the heartbeat cannot run, so the 15-minute cadence
  applies as designed.
- **Cron granularity.** The cron runs every minute, so a push may arrive up to
  a minute after the 15-minute mark.
- **KV consistency.** Cloudflare KV is eventually consistent. For small scale
  (hobby use) this is fine; under heavy load a device could rarely be skipped
  for one cycle.
- **Free-tier limits.** Every minute the cron lists device keys and reads each
  due device. With few devices this is well within the Workers Free plan
  limits; the Bundled/Standard plans give more headroom. Each notification
  cycle also writes the device record.
- **Push support.** Web Push (with VAPID) works on Chrome, Edge, Firefox
  desktop, and Android Chrome. iOS/ iPadOS Safari supports installed-home-screen
  web apps only (iOS 16.4+). The toggle hides the feature on unsupported
  browsers.
- **No auth.** Endpoints are public and keyed only by `deviceId`. Anyone who
  knows a deviceId can move that device's index — acceptable for this app, but
  don't store anything sensitive.
- **Stale devices.** Records whose push subscription has been revoked (HTTP
  404/410 from the push service) are deleted automatically on the next push
  attempt.
- **Name data.** The names list (`data:names`) is refreshed by whichever
  device registers last; all devices share the same list. Updating the
  frontend's data automatically refreshes the backend's copy on the next
  registration.

---

## Troubleshooting

### "Registration failed - push service error" when turning reminders on

The browser's push service (FCM for Chrome/Edge, Mozilla autopush for Firefox)
rejected the subscription. Check in this order:

1. **VAPID keys.** Open `https://<worker-url>/debug/vapid`. All of
   `publicKeyOk`, `privateKeyOk` and `match` must be `true`:

   ```bash
   curl https://vishnu-name-push.<your-subdomain>.workers.dev/debug/vapid
   # {"publicKeyOk":true,"privateKeyOk":true,"match":true,"publicKeyLength":65}
   ```

   If not, regenerate and re-set **both** secrets (public and private keys are
   a matching pair — don't mix them up, and don't add quotes):

   ```bash
   npm run generate-keys
   npx wrangler secret put VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   ```

   A correct public key is 87 base64url characters (65 bytes) starting with
   `B`. No redeploy is needed after changing secrets — just reload the page
   and toggle reminders off/on.

2. **Push service reachability.** If `/debug/vapid` is all-good, the push
   service itself is likely unreachable: corporate VPN/proxy, ad-blockers,
   or browser builds without Google services can block `fcm.googleapis.com`
   (Chrome/Edge) or `*.push.services.mozilla.com` (Firefox). Try another
   browser or network. In Chrome, `chrome://push-internals` shows the exact
   error the push service returned.

3. **Private/incognito windows** often block push subscriptions — use a
   normal window.

### No notification arrives after 15 minutes

- Leave the page closed or in the background; the heartbeat only runs while
  the page is open.
- `npm run tail` shows cron activity and push errors.
- Check the device actually has `enabled: true`: register again by toggling
  reminders off/on.
- If the push service returned 404/410, the device record was deleted —
  toggle reminders on again.
