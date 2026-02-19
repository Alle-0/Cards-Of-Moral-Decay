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

        const title = data.title || 'Notification';
        const options = {
            body: data.body || '',
            icon: '/assets/icon.png', // Adjust path if needed
            badge: '/assets/icon.png',
            data: data.data,
            vibrate: data.vibrate || [200, 100, 200]
        };

        event.waitUntil(self.registration.showNotification(title, options));
    } catch (err) {
        console.error('Error handling push event:', err);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
