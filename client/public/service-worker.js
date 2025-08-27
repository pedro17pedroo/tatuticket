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

// Advanced Push notifications with customization by type
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'TatuTicket',
    body: 'Você tem novas atualizações no TatuTicket',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'Abrir App' },
      { action: 'close', title: 'Fechar' }
    ],
    requireInteraction: false,
    silent: false,
    tag: 'tatuticket-general'
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        title: payload.title || notificationData.title,
        body: payload.body || notificationData.body,
        data: payload.data || notificationData.data,
        icon: payload.icon || notificationData.icon,
        tag: payload.tag || 'tatuticket-notification'
      };
      
      // Customize by notification type
      if (payload.type === 'ticket.created') {
        notificationData.icon = '/icon-192x192.png';
        notificationData.actions = [
          { action: 'view_ticket', title: 'Ver Ticket' },
          { action: 'dismiss', title: 'Dispensar' }
        ];
        notificationData.data = { ...notificationData.data, ticketId: payload.ticketId };
      } else if (payload.type === 'sla.breach') {
        notificationData.vibrate = [200, 100, 200, 100, 200];
        notificationData.requireInteraction = true;
        notificationData.tag = 'sla-critical';
        notificationData.actions = [
          { action: 'urgent_view', title: 'Ver Urgente' },
          { action: 'dismiss', title: 'Dispensar' }
        ];
      } else if (payload.type === 'assignment') {
        notificationData.actions = [
          { action: 'accept', title: 'Aceitar' },
          { action: 'view', title: 'Visualizar' }
        ];
      }
    } catch (e) {
      console.error('Error parsing push notification data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: notificationData.vibrate,
      data: notificationData.data,
      actions: notificationData.actions,
      tag: notificationData.tag,
      renotify: true,
      requireInteraction: notificationData.requireInteraction,
      silent: notificationData.silent
    })
  );
});

// Enhanced notification click handler with action support
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};
  let urlToOpen = data.url || '/';

  // Handle different actions
  if (action === 'view_ticket' && data.ticketId) {
    urlToOpen = `/organization/tickets/${data.ticketId}`;
  } else if (action === 'urgent_view') {
    urlToOpen = data.url || '/organization/dashboard';
  } else if (action === 'accept' && data.ticketId) {
    // Accept assignment and navigate
    urlToOpen = `/organization/tickets/${data.ticketId}?accept=true`;
  } else if (action === 'dismiss' || action === 'close') {
    // Just close, don't navigate
    return;
  } else if (!action && event.notification.data?.url) {
    // Default click without specific action
    urlToOpen = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing tab with same domain
        const targetOrigin = new URL(urlToOpen, self.registration.scope).origin;
        for (const client of clientList) {
          if (client.url.includes(targetOrigin) && 'focus' in client) {
            client.focus();
            // Navigate to specific URL
            if (client.navigate) {
              return client.navigate(urlToOpen);
            }
            return client;
          }
        }
        // Open new tab if none found
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync para envio offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  console.log('TatuTicket: Background sync triggered');
  
  try {
    // Busca dados offline pendentes
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          await removeOfflineAction(action.id);
          console.log('TatuTicket: Action synced successfully:', action.id);
        }
      } catch (error) {
        console.error('TatuTicket: Failed to sync action:', action.id, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('TatuTicket: Background sync failed:', error);
    return false;
  }
}

async function getOfflineActions() {
  // Retorna ações offline armazenadas
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readonly');
    const store = transaction.objectStore('offlineActions');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('TatuTicket: Error getting offline actions:', error);
    return [];
  }
}

async function removeOfflineAction(actionId) {
  // Remove ação do armazenamento offline
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    store.delete(actionId);
    
    console.log('TatuTicket: Removing offline action:', actionId);
    return true;
  } catch (error) {
    console.error('TatuTicket: Error removing offline action:', error);
    return false;
  }
}

async function storeOfflineAction(action) {
  // Armazena ação para execução quando voltar online
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offlineActions'], 'readwrite');
    const store = transaction.objectStore('offlineActions');
    
    const actionWithId = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      ...action
    };
    
    store.add(actionWithId);
    console.log('TatuTicket: Stored offline action:', actionWithId);
    return actionWithId.id;
  } catch (error) {
    console.error('TatuTicket: Error storing offline action:', error);
    return null;
  }
}

async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TatuTicketOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineActions')) {
        const store = db.createObjectStore('offlineActions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

