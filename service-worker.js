// service-worker.js
const VERSION = 'v1';
const CACHE_NAME = `push-notifications-${VERSION}`;

// Install event - cache basic assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/icon.png'
            ]);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name.startsWith('push-notifications-') && name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

// Push event - handle incoming push messages
self.addEventListener('push', event => {
    try {
        let notificationData = {
            title: 'New Notification',
            body: 'No content provided.',
            icon: '/icon.png',
            badge: '/badge.png',
            timestamp: Date.now(),
            requireInteraction: true,
            data: {}
        };

        if (event.data) {
            const payload = event.data.json();
            notificationData = {
                ...notificationData,
                ...payload
            };
        }

        // Add vibration pattern if device supports it
        if ('vibrate' in navigator) {
            notificationData.vibrate = [100, 50, 100];
        }

        // Add actions if provided
        if (notificationData.actions) {
            notificationData.actions = notificationData.actions.map(action => ({
                action: action.action,
                title: action.title,
                icon: action.icon
            }));
        }

        const showNotification = self.registration.showNotification(
            notificationData.title,
            {
                body: notificationData.body,
                icon: notificationData.icon,
                badge: notificationData.badge,
                timestamp: notificationData.timestamp,
                requireInteraction: notificationData.requireInteraction,
                vibrate: notificationData.vibrate,
                data: notificationData.data,
                actions: notificationData.actions,
                tag: notificationData.tag || 'default-tag', // Group similar notifications
                renotify: notificationData.renotify || false // Whether to notify again if using the same tag
            }
        );

        event.waitUntil(showNotification);
    } catch (err) {
        console.error('Error showing notification:', err);
    }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', event => {
    event.notification.close();

    // Handle notification click
    const clickHandler = async () => {
        try {
            // Get all windows/tabs matching the target URL
            const windowClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Navigate existing window if it exists
            if (event.notification.data && event.notification.data.url) {
                const url = event.notification.data.url;
                
                // Check if there's already a window/tab open with this URL
                const matchingClient = windowClients.find(client => 
                    client.url === url
                );

                if (matchingClient) {
                    // Focus existing window/tab
                    return matchingClient.focus();
                } else {
                    // Open new window/tab
                    return clients.openWindow(url);
                }
            }

            // If no URL provided, focus or open main page
            const matchingClient = windowClients[0];
            if (matchingClient) {
                return matchingClient.focus();
            } else {
                return clients.openWindow('/');
            }
        } catch (err) {
            console.error('Error handling notification click:', err);
        }
    };

    event.waitUntil(clickHandler());
});

// Notification close event - handle when user dismisses notification
self.addEventListener('notificationclose', event => {
    // You could send analytics data here about dismissed notifications
    console.log('Notification was closed', event.notification);
});

// Handle incoming messages from the web app
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Optional: Handle background sync for offline functionality
self.addEventListener('sync', event => {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(
            // Sync notifications that failed to send while offline
            syncNotifications()
        );
    }
});

async function syncNotifications() {
    try {
        // Implementation for syncing notifications
        // This would typically involve checking IndexedDB for failed notifications
        // and retrying to send them
    } catch (err) {
        console.error('Error syncing notifications:', err);
    }
                  }
