/**
 * Service worker for the Vishnu Sahasranama page.
 *
 * Handles:
 *  - `push` events: shows a notification with the next name. The payload
 *    (JSON) is sent by the name-push Cloudflare Worker and looks like:
 *      { index, number, word, meaning, deviceId, apiBase }
 *  - `notificationclick`:
 *      - "next" action button: POSTs /advance to the backend to move this
 *        device to the next name and shows a fresh notification.
 *      - notification body: focuses an open page (telling it to jump to the
 *        name) or opens the page at `?name=<flat index>`.
 */

const ICON_URL = () => new URL('bothfeet.png', self.registration.scope).href;

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    return;
  }
  const index = typeof data.index === 'number' ? data.index : 0;
  const number = typeof data.number === 'number' ? data.number : index + 1;
  const title = `${number}. ${data.word || 'Next name'}`;
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.meaning || 'Open to continue the Vishnu Sahasranama.',
      icon: ICON_URL(),
      badge: ICON_URL(),
      tag: 'sahasranama-name',
      renotify: true,
      data: {
        index,
        deviceId: data.deviceId,
        apiBase: data.apiBase,
      },
      actions: [{ action: 'next', title: 'Next name' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const data = notification.data || {};
  event.waitUntil(
    (async () => {
      if (event.action === 'next' && data.deviceId && data.apiBase) {
        notification.close();
        try {
          await advanceAndReshow(data);
        } catch {
          await openApp(typeof data.index === 'number' ? data.index : 0);
        }
        return;
      }
      notification.close();
      await openApp(typeof data.index === 'number' ? data.index : 0);
    })()
  );
});

async function advanceAndReshow(data) {
  const response = await fetch(`${data.apiBase}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: data.deviceId }),
  });
  if (!response.ok) {
    throw new Error(`advance failed with ${response.status}`);
  }
  const state = await response.json();
  const index = state.currentIndex;
  const name = state.name || {};
  const number = typeof name.number === 'number' ? name.number : index + 1;
  await self.registration.showNotification(`${number}. ${name.word || 'Next name'}`, {
    body: name.meaning || 'Open to continue the Vishnu Sahasranama.',
    icon: ICON_URL(),
    badge: ICON_URL(),
    tag: 'sahasranama-name',
    renotify: true,
    data: {
      index,
      deviceId: data.deviceId,
      apiBase: data.apiBase,
    },
    actions: [{ action: 'next', title: 'Next name' }],
  });
  await messageClients({ type: 'follow-name', entryIndex: index });
}

async function openApp(entryIndex) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
      client.postMessage({ type: 'follow-name', entryIndex });
      return client.focus();
    }
  }
  return self.clients.openWindow(`${self.registration.scope}?name=${entryIndex}`);
}

async function messageClients(payload) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  await Promise.all(clients.map((client) => client.postMessage(payload)));
}
