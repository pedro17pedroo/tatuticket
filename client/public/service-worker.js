const CACHE_NAME = 'tatuticket-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('TatuTicket: Cache opened');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('TatuTicket: Static resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('TatuTicket: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('TatuTicket: Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API requests - always fetch from network for real-time data
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('TatuTicket: Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('TatuTicket: Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache invalid responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response before caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Serve offline fallback for HTML requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background sync for offline ticket creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'ticket-sync') {
    event.waitUntil(syncTickets());
  }
});

async function syncTickets() {
  try {
    // Get pending tickets from IndexedDB (would need to implement)
    console.log('TatuTicket: Syncing offline tickets...');
    // Implementation would sync any offline-created tickets
  } catch (error) {
    console.error('TatuTicket: Error syncing tickets:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Nova notificação do TatuTicket',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'tatuticket-notification',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'TatuTicket', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if TatuTicket is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
