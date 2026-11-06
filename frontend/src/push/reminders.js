import { getAllNameEntries, isSameEntry } from '../nameEntries';
import { transliterate } from '../transliterate';

/**
 * Client side of the "name reminders" feature (see ../../name-push/README.md).
 *
 * - Each browser install gets a random deviceId in localStorage (no accounts).
 * - enableReminders() asks for notification permission, registers ./sw.js,
 *   subscribes to Web Push and POSTs /register with the subscription and the
 *   full names list.
 * - notifyNameChanged(index) is called by the views whenever the shown name
 *   changes; it POSTs /state, which resets the backend's 15-minute idle timer.
 * - initReminders() also sends a throttled /activity heartbeat when the user
 *   taps the page without changing names, and listens for follow requests
 *   (from the service worker or the backend) to jump to a given flat index.
 */

const DEVICE_ID_KEY = 'deviceId';
const REMINDERS_ENABLED_KEY = 'nameRemindersEnabled';
const API_BASE_KEY = 'namePushApiBase';
// Set this to the deployed name-push worker URL, e.g.
// 'https://vishnu-name-push.<your-subdomain>.workers.dev'
// (see name-push/README.md). Can also be overridden at runtime with:
//   localStorage.setItem('namePushApiBase', '<url>')
const DEFAULT_API_BASE = 'https://vishnu-name-push.sahasra.workers.dev';
const FOLLOW_NAME_EVENT = 'sahasranama:follow-name';
const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

let initialized = false;
let lastActivitySent = 0;

export function getApiBase() {
  try {
    return localStorage.getItem(API_BASE_KEY) || DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous-device';
  }
}

export function isRemindersEnabled() {
  try {
    return localStorage.getItem(REMINDERS_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

/** Flat index of the name currently highlighted (per localStorage), or 0. */
export function getCurrentEntryIndex() {
  try {
    const saved = JSON.parse(localStorage.getItem('highlightedWord') ?? 'null');
    if (saved) {
      const found = getAllNameEntries().findIndex((entry) => isSameEntry(entry, saved));
      if (found >= 0) {
        return found;
      }
    }
  } catch {
    // ignore malformed saved state
  }
  return 0;
}

/**
 * Reads and strips the `?name=<index>` URL parameter used by notification
 * deep links. Returns -1 when absent or invalid.
 */
export function consumeNameParam() {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('name');
    if (raw === null) {
      return -1;
    }
    params.delete('name');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    );
    const index = Number.parseInt(raw, 10);
    return Number.isInteger(index) && index >= 0 ? index : -1;
  } catch {
    return -1;
  }
}

function follow(entryIndex) {
  window.dispatchEvent(new CustomEvent(FOLLOW_NAME_EVENT, { detail: { entryIndex } }));
}

/**
 * Subscribes the caller to follow requests (jump to a given flat name index).
 * Returns an unsubscribe function.
 */
export function followName(handler) {
  const listener = (event) => {
    const entryIndex = event.detail ? event.detail.entryIndex : undefined;
    if (Number.isInteger(entryIndex) && entryIndex >= 0) {
      handler(entryIndex);
    }
  };
  window.addEventListener(FOLLOW_NAME_EVENT, listener);
  return () => window.removeEventListener(FOLLOW_NAME_EVENT, listener);
}

async function api(path, body) {
  const response = await fetch(`${getApiBase()}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}`);
  }
  return response.json();
}

function syncState(currentIndex) {
  if (!isRemindersEnabled()) {
    return;
  }
  api('/state', { deviceId: getDeviceId(), currentIndex }).catch(() => {});
}

function sendActivity() {
  if (!isRemindersEnabled()) {
    return;
  }
  const now = Date.now();
  if (now - lastActivitySent < ACTIVITY_THROTTLE_MS) {
    return;
  }
  lastActivitySent = now;
  api('/activity', { deviceId: getDeviceId() }).catch(() => {});
}

async function syncFromServer() {
  if (!isRemindersEnabled()) {
    return;
  }
  try {
    const state = await api(`/state?deviceId=${encodeURIComponent(getDeviceId())}`);
    if (Number.isInteger(state.currentIndex) && state.currentIndex !== getCurrentEntryIndex()) {
      follow(state.currentIndex);
    }
  } catch {
    // backend unreachable; stay on the local position
  }
}

/** Names list uploaded once per device registration so the backend can
 *  compose notification text. */
function buildNamesPayload() {
  return getAllNameEntries().map((entry, i) => ({
    number: i + 1,
    word: transliterate(entry.word, 'iast'),
    meaning: entry.meaning,
  }));
}

function assertPushSupported() {
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    typeof Notification === 'undefined'
  ) {
    throw new Error('Push notifications are not supported in this browser.');
  }
}

function assertValidServerKey(keyBytes) {
  if (keyBytes.length === 65 && keyBytes[0] === 0x04) {
    return;
  }
  throw new Error(
    `The backend returned an invalid VAPID public key (${keyBytes.length} bytes instead of 65). ` +
      'Regenerate the keys with `npm run generate-keys` in name-push/ and re-set both ' +
      'VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets, then check https://<worker-url>/debug/vapid.'
  );
}

async function subscribeToPush(registration, keyBytes) {
  try {
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes,
      });
    }
    return subscription;
  } catch (err) {
    if (/push service error/i.test(err.message || '')) {
      throw new Error(
        `The push service rejected the subscription (${err.message}). Either the VAPID keys ` +
          'configured on the worker are invalid (check <worker-url>/debug/vapid) or the push ' +
          'service is unreachable from this network/browser (VPN, proxy, ad-blocker, incognito). '
      );
    }
    throw err;
  }
}

export async function enableReminders() {
  assertPushSupported();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      'Notification permission was not granted (' + permission + '). If no prompt appeared: check the site\u2019s ' +
        'notification permission in the browser (address bar icon \u2192 Permissions \u2192 Notifications \u2192 Ask) ' +
        'and, on Android, that the browser app itself may show notifications ' +
        '(Android Settings \u2192 Apps \u2192 Chrome \u2192 Notifications).'
    );
  }
  const registration = await navigator.serviceWorker.register('sw.js');
  await navigator.serviceWorker.ready;
  const { publicKey } = await api('/vapid-public-key');
  const keyBytes = urlBase64ToUint8Array(publicKey);
  assertValidServerKey(keyBytes);
  const subscription = await subscribeToPush(registration, keyBytes);
  await api('/register', {
    deviceId: getDeviceId(),
    subscription: subscription.toJSON(),
    enabled: true,
    currentIndex: getCurrentEntryIndex(),
    apiBase: getApiBase(),
    names: buildNamesPayload(),
  });
  try {
    localStorage.setItem(REMINDERS_ENABLED_KEY, 'true');
  } catch {
    // ignore storage failures
  }
  // Immediate end-to-end confirmation: one test push right after subscribing.
  api('/test-push', { deviceId: getDeviceId() }).catch(() => {});
  await syncFromServer();
}

export async function disableReminders() {
  try {
    localStorage.setItem(REMINDERS_ENABLED_KEY, 'false');
  } catch {
    // ignore storage failures
  }
  try {
    await api('/register', { deviceId: getDeviceId(), enabled: false });
  } catch {
    // best effort; the cron will also stop after pushes fail repeatedly
  }
}

/** Wire up one-time listeners: SW follow messages and activity heartbeat. */
export function initReminders() {
  if (initialized) {
    return;
  }
  initialized = true;
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data;
      if (data && data.type === 'follow-name') {
        follow(data.entryIndex);
      }
    });
  }
  window.addEventListener('pointerdown', sendActivity);
  window.addEventListener('keydown', sendActivity);
  window.addEventListener('wheel', sendActivity);
  syncFromServer();
}

/** Called by the views whenever the shown name changes. */
export function notifyNameChanged(entryIndex) {
  syncState(entryIndex);
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
