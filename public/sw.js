// Bourbon Oak Lover — service worker for Web Push notifications.
// Registered by src/components/PushManager.tsx after the user installs the PWA.

const ICON = "/icons/icon-192.png";
const BADGE = "/icons/icon-192.png";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { title: "Bourbon Oak Lover", body: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Bourbon Oak Lover";
  const options = {
    body: payload.body || "",
    icon: payload.icon || ICON,
    badge: payload.badge || BADGE,
    image: payload.image,
    tag: payload.tag || "bol-announcement",
    renotify: true,
    data: { url: payload.url || "/" },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          try {
            const clientUrl = new URL(client.url);
            const target = new URL(targetUrl, self.location.origin);
            if (clientUrl.origin === target.origin && "focus" in client) {
              client.navigate(target.href).catch(() => {});
              return client.focus();
            }
          } catch (_e) {
            // ignore malformed URLs
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
