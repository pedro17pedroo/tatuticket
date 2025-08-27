const CACHE_NAME = 'tatuticket-v2';
const API_CACHE_NAME = 'tatuticket-api-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/saas',
  '/organization',  
  '/customer',
  '/admin',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Cache estratégico para dados críticos
const CACHEABLE_API_ROUTES = [
  '/api/auth/demo-credentials',
  '/api/analytics/ticket-stats',
  '/api/ai/insights'
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

  // Estratégia inteligente para APIs
  if (event.request.url.includes('/api/')) {
    const isCacheableAPI = CACHEABLE_API_ROUTES.some(route => 
      event.request.url.includes(route)
    );
    
    if (isCacheableAPI) {
      event.respondWith(handleAPICache(event.request));
      return;
    } else {
      // APIs críticas sempre da rede
      return;
    }
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
            
            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Estratégia inteligente de cache para APIs
async function handleAPICache(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Se sucesso, atualiza o cache
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log('TatuTicket: API response cached:', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    // Se falhar, usa cache como fallback
    console.log('TatuTicket: Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('TatuTicket: Serving API from cache (offline):', request.url);
      return cachedResponse;
    }
    
    // Retorna resposta offline se não há cache
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'Recurso não disponível offline',
        cached: false
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: 'Você tem novas atualizações no TatuTicket',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close', 
        title: 'Fechar'
      }
    ]
  };

  if (event.data) {
    const payload = event.data.json();
    options.body = payload.body || options.body;
    options.data = payload.data || options.data;
  }

  event.waitUntil(
    self.registration.showNotification('TatuTicket', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Foca em tab existente se disponível
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Senão, abre nova tab
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Background sync para envio offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('TatuTicket: Background sync triggered');
  // Implementar sincronização de dados offline
}

