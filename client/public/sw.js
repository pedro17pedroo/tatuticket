// TatuTicket Service Worker - PWA Implementation
// Implements offline functionality and caching as required by PRD sections 1.2, 2, 3

const CACHE_NAME = 'tatuticket-v1';
const API_CACHE_NAME = 'tatuticket-api-v1';

// Essential files to cache for offline functionality
const STATIC_CACHE_FILES = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css',
  '/organization',
  '/customer', 
  '/admin',
  '/organization/login',
  '/customer/login',
  '/admin/login'
];

// API endpoints to cache for basic offline functionality
const API_CACHE_PATTERNS = [
  /^\/api\/auth\/me$/,
  /^\/api\/tickets$/,
  /^\/api\/organizations$/,
  /^\/api\/departments$/,
  /^\/api\/teams$/,
  /^\/api\/users$/
];

// Install event - Cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static resources');
        return cache.addAll(STATIC_CACHE_FILES);
      })
      .then(() => {
        console.log('[SW] Service worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - Handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle API requests with Network First strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static resources with Cache First strategy
  event.respondWith(cacheFirstStrategy(request));
});

// Network First Strategy - For API calls
async function networkFirstStrategy(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    
    // Cache successful API responses if they match patterns
    if (networkResponse.ok && shouldCacheApiRequest(url.pathname)) {
      const cache = await caches.open(API_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for essential API calls
    if (url.pathname === '/api/auth/me') {
      return new Response(JSON.stringify({ error: 'Offline mode' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    throw error;
  }
}

// Cache First Strategy - For static resources
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response);
        }
      })
      .catch(() => {
        // Ignore background update errors
      });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return fallback for offline navigation
    if (request.destination === 'document') {
      const fallbackResponse = await caches.match('/index.html');
      return fallbackResponse || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Check if API request should be cached
function shouldCacheApiRequest(pathname) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(pathname));
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (!event.data) {
    return;
  }
  
  const options = {
    body: 'You have a new notification from TatuTicket',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open TatuTicket',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };
  
  try {
    const payload = event.data.json();
    options.title = payload.title || 'TatuTicket Notification';
    options.body = payload.body || options.body;
    options.data = { ...options.data, ...payload.data };
  } catch (error) {
    console.log('[SW] Push payload is not JSON');
    options.title = 'TatuTicket Notification';
  }
  
  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none exists
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-tickets') {
    event.waitUntil(syncPendingTickets());
  }
});

// Sync pending tickets when back online
async function syncPendingTickets() {
  try {
    // Get pending tickets from IndexedDB or localStorage
    const pendingTickets = await getPendingOfflineTickets();
    
    for (const ticket of pendingTickets) {
      try {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ticket.data),
          credentials: 'include'
        });
        
        if (response.ok) {
          await removePendingOfflineTicket(ticket.id);
          console.log('[SW] Synced offline ticket:', ticket.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync ticket:', ticket.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Placeholder functions for offline data management
async function getPendingOfflineTickets() {
  // This would integrate with IndexedDB in a real implementation
  return [];
}

async function removePendingOfflineTicket(ticketId) {
  // This would remove from IndexedDB in a real implementation
  console.log('[SW] Removing synced ticket:', ticketId);
}