
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      url: event.data?.json()?.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('BiciCare', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
