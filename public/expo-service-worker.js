/* eslint-env serviceworker */

self.addEventListener('install', (event) => {
    console.log('Expo Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Expo Service Worker activated');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('Push event but no data');
        return;
    }

    try {
        const data = event.data.json();
        console.log('Push data:', data);

        const title = data.title || 'Cards of Moral Decay';
        const options = {
            body: data.body || '',
            icon: data.icon || '/icon-192.png',
            badge: data.badge || '/icon-192.png',
            image: data.image || undefined,
            data: data.data || {},
            vibrate: data.vibrate || [200, 100, 200],
            actions: data.actions || []
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error('Error handling push event:', err);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    const urlToOpen = data.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if there is already a window of this app open
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'navigate' in client) {
                    client.focus();
                    return client.navigate(urlToOpen);
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
