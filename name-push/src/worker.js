import { sendNotification, validateVapidKeys } from './webpush.js';

/**
 * name-push worker
 *
 * Per-device (not per-user) push notification backend for the Vishnu
 * Sahasranama page. Each browser registers itself with a random deviceId and
 * keeps the backend informed of the name (flat entry index) it is currently
 * showing. If the device stays idle for 15 minutes, the cron job pushes a
 * notification containing the NEXT name and advances the device's stored
 * index, so the next idle push (another 15 minutes later) contains the name
 * after that, and so on.
 *
 * Any activity from the device (name change, tap heartbeat) resets the
 * 15-minute timer.
 *
 * Storage: KV namespace NAMES_KV
 *   device:<deviceId> -> JSON device record (subscription, enabled,
 *                        currentIndex, nextPushAt, apiBase)
 *   data:names        -> JSON array of { number, word, meaning } for all
 *                        1000 names (last device that registered wins)
 */

const IDLE_INTERVAL_MS = 15 * 60 * 1000;
const PUSH_RETRY_MS = 5 * 60 * 1000;
const DEVICE_PREFIX = 'device:';
const NAMES_KEY = 'data:names';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function readJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

async function getDevice(env, deviceId) {
  if (!deviceId) {
    return null;
  }
  const raw = await env.NAMES_KV.get(DEVICE_PREFIX + deviceId);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function putDevice(env, device) {
  await env.NAMES_KV.put(DEVICE_PREFIX + device.deviceId, JSON.stringify(device));
}

async function getNames(env) {
  const raw = await env.NAMES_KV.get(NAMES_KEY);
  if (!raw) {
    return null;
  }
  try {
    const names = JSON.parse(raw);
    return Array.isArray(names) && names.length > 0 ? names : null;
  } catch {
    return null;
  }
}

/**
 * Sends a push to a device.
 * Returns true when delivered, false when the subscription is gone
 * (the caller should delete the record), throws on transient failures.
 */
async function sendPushTo(env, device, payload) {
  try {
    await sendNotification(device.subscription, JSON.stringify(payload), {
      vapidPublicKey: env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: env.VAPID_PRIVATE_KEY,
      ttl: 3 * 24 * 3600,
    });
    return true;
  } catch (err) {
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      return false;
    }
    throw err;
  }
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const body = request.method === 'POST' ? readJson(await request.text()) : {};
    const deviceId = body.deviceId || url.searchParams.get('deviceId');

    switch (`${request.method} ${path}`) {
      case 'GET /': {
        return json({ ok: true, service: 'name-push' });
      }

      case 'GET /vapid-public-key': {
        if (!env.VAPID_PUBLIC_KEY) {
          return json({ error: 'VAPID_PUBLIC_KEY secret is not configured' }, 500);
        }
        return json({ publicKey: env.VAPID_PUBLIC_KEY.trim() });
      }

      // Troubleshooting helper: validates the configured VAPID key pair.
      case 'GET /debug/vapid': {
        if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
          return json({ error: 'VAPID secrets are not configured' }, 500);
        }
        return json(await validateVapidKeys(env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY));
      }

      // Register / re-register a device. The frontend calls this when the
      // user turns reminders on (with subscription + names), and with
      // { enabled: false } when turning them off.
      case 'POST /register': {
        if (!deviceId) {
          return json({ error: 'deviceId is required' }, 400);
        }
        const device = (await getDevice(env, deviceId)) ?? {
          deviceId,
          currentIndex: 0,
        };
        if (body.subscription && body.subscription.endpoint) {
          device.subscription = body.subscription;
        }
        device.enabled = body.enabled !== false;
        device.apiBase = body.apiBase || url.origin;
        if (Number.isInteger(body.currentIndex)) {
          device.currentIndex = Math.max(0, body.currentIndex);
        }
        device.nextPushAt = Date.now() + IDLE_INTERVAL_MS;
        await putDevice(env, device);

        if (Array.isArray(body.names) && body.names.length > 0) {
          await env.NAMES_KV.put(NAMES_KEY, JSON.stringify(body.names));
        }
        return json({ ok: true, currentIndex: device.currentIndex });
      }

      // Frontend reports the name it is currently showing.
      case 'POST /state': {
        const device = await getDevice(env, deviceId);
        if (!device) {
          return json({ error: 'unknown device' }, 404);
        }
        if (Number.isInteger(body.currentIndex)) {
          device.currentIndex = Math.max(0, body.currentIndex);
        }
        device.nextPushAt = Date.now() + IDLE_INTERVAL_MS;
        await putDevice(env, device);
        return json({ ok: true, currentIndex: device.currentIndex });
      }

      // Lightweight "user tapped something" heartbeat; resets the idle timer.
      case 'POST /activity': {
        const device = await getDevice(env, deviceId);
        if (!device) {
          return json({ error: 'unknown device' }, 404);
        }
        device.nextPushAt = Date.now() + IDLE_INTERVAL_MS;
        await putDevice(env, device);
        return json({ ok: true });
      }

      // Pull current state (used to follow server-side advances when the
      // page is opened after pushes fired while it was closed).
      case 'GET /state': {
        const device = await getDevice(env, deviceId);
        if (!device) {
          return json({ error: 'unknown device' }, 404);
        }
        return json({ currentIndex: device.currentIndex, enabled: device.enabled });
      }

      // Sends a test push to the device right away (used after enabling
      // reminders, to confirm the subscription works end to end).
      case 'POST /test-push': {
        const device = await getDevice(env, deviceId);
        if (!device) {
          return json({ error: 'unknown device' }, 404);
        }
        if (!device.enabled || !device.subscription) {
          return json({ error: 'device is not subscribed' }, 400);
        }
        const names = await getNames(env);
        const index = device.currentIndex;
        const name = names ? names[index] : null;
        const payload = {
          index,
          number: (name && name.number) || index + 1,
          word: (name && name.word) || 'Test push',
          meaning: (name && name.meaning) || 'Push is working for this device.',
          deviceId: device.deviceId,
          apiBase: device.apiBase,
        };
        let delivered;
        try {
          delivered = await sendPushTo(env, device, payload);
        } catch (err) {
          return json({ error: `push failed: ${err.message}` }, 502);
        }
        if (!delivered) {
          return json(
            {
              error:
                'push service rejected the subscription (404/410) - toggle reminders off and on to re-register',
            },
            410
          );
        }
        return json({ ok: true, sentIndex: index });
      }

      // Advances the device to the next name. Called by the service worker
      // when the user taps the "Next name" button on a notification.
      case 'POST /advance': {
        const device = await getDevice(env, deviceId);
        if (!device) {
          return json({ error: 'unknown device' }, 404);
        }
        const names = await getNames(env);
        const total = names ? names.length : 1000;
        device.currentIndex = (device.currentIndex + 1) % total;
        device.nextPushAt = Date.now() + IDLE_INTERVAL_MS;
        await putDevice(env, device);
        const name = names ? names[device.currentIndex] : null;
        return json({ ok: true, currentIndex: device.currentIndex, name });
      }

      default:
        return json({ error: 'not found' }, 404);
    }
  },

  /**
   * Runs every minute. For each enabled device whose idle timer has expired,
   * pushes the next name and advances the stored index.
   */
  async scheduled(event, env, ctx) {
    const now = Date.now();
    let cursor;

    do {
      const page = await env.NAMES_KV.list({ prefix: DEVICE_PREFIX, cursor });
      cursor = page.list_complete ? undefined : page.cursor;

      for (const key of page.keys) {
        const raw = await env.NAMES_KV.get(key.name);
        if (!raw) {
          continue;
        }
        let device;
        try {
          device = JSON.parse(raw);
        } catch {
          continue;
        }

        if (!device.enabled || !device.subscription || !Number.isInteger(device.currentIndex)) {
          continue;
        }
        if (!device.nextPushAt || now < device.nextPushAt) {
          continue;
        }

        const names = await getNames(env);
        const total = names ? names.length : 1000;
        const nextIndex = (device.currentIndex + 1) % total;
        const name = names ? names[nextIndex] : null;
        const payload = {
          index: nextIndex,
          number: (name && name.number) || nextIndex + 1,
          word: (name && name.word) || 'The next name is waiting',
          meaning: (name && name.meaning) || 'Open to continue the Sahasranama.',
          deviceId: device.deviceId,
          apiBase: device.apiBase,
        };

        let delivered;
        try {
          delivered = await sendPushTo(env, device, payload);
        } catch (err) {
          console.error('push failed for device', device.deviceId, err);
          device.nextPushAt = now + PUSH_RETRY_MS;
          await putDevice(env, device);
          continue;
        }

        if (!delivered) {
          // Subscription expired / unsubscribed: drop the device record.
          console.log('idle push: subscription gone, deleting device', device.deviceId);
          await env.NAMES_KV.delete(key.name);
          continue;
        }

        console.log(
          `idle push: sent name ${nextIndex + 1} to device ${device.deviceId}; next push at ${new Date(now + IDLE_INTERVAL_MS).toISOString()}`
        );

        device.currentIndex = nextIndex;
        device.nextPushAt = now + IDLE_INTERVAL_MS;
        await putDevice(env, device);
      }
    } while (cursor);
  },
};
