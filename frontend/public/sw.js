/* eslint-disable no-restricted-globals */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "IQLead";
  const body = data.message || "You have a new notification.";
  const options = {
    body,
    data: data || {},
    tag: data.type || "iqlead",
    renotify: false
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      if (allClients.length) {
        allClients[0].focus();
        return;
      }
      await clients.openWindow("/dashboard");
    })()
  );
});

