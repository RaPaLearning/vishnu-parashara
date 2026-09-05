// Service worker for Sahasranama idle reminders.
// Enables notification action buttons (e.g. "Next") which are only
// available through service-worker notifications.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const isNext = event.action === 'next';
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      if (isNext) {
        // Ask every open app window to advance to the next name.
        clientsList.forEach((client) => client.postMessage({ type: 'NEXT_NAME' }));
        if (clientsList.length > 0) {
          return;
        }
      } else if (clientsList.length > 0) {
        // Tapping the notification body just brings the app forward.
        await clientsList[0].focus();
        return;
      }

      // No open window: launch the app (it restores the saved name).
      await self.clients.openWindow('/vishnu-parashara/');
    })()
  );
});
