const CACHE_NAME = 'superfacts-v1.0.0';
const STATIC_CACHE = 'superfacts-static-v1';
const DYNAMIC_CACHE = 'superfacts-dynamic-v1';

// Файлы для кеширования при установке
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/images/default-article.svg'
];

// API endpoints для кеширования
const API_CACHE_PATTERNS = [
  /\/api\/news/,
  /\/api\/translate/,
  /\/api\/recommendations/
];

// Максимальное количество статей в динамическом кеше
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Установка Service Worker
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting(); // Активировать сразу
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('SW: Activated');
      return self.clients.claim(); // Контролировать все открытые страницы
    })
  );
});

// Обработка fetch запросов
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // Пропускаем Chrome extension URLs
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // 1. Статические ресурсы - cache first
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    return cacheFirst(request, STATIC_CACHE);
  }

  // 2. API запросы - network first с fallback на cache
  if (url.pathname.startsWith('/api/')) {
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return networkFirstWithCache(request, DYNAMIC_CACHE);
    }
    return networkOnly(request);
  }

  // 3. Изображения - cache first
  if (request.destination === 'image') {
    return cacheFirst(request, DYNAMIC_CACHE);
  }

  // 4. Навигация - network first с offline fallback
  if (request.mode === 'navigate') {
    return networkFirstWithOfflineFallback(request);
  }

  // 5. Остальное - network first
  return networkFirst(request);
}

// Стратегия: Cache First
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Обновляем в фоне если это API запрос
    if (request.url.includes('/api/')) {
      fetch(request)
        .then(response => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
        })
        .catch(() => {}); // Игнорируем ошибки фонового обновления
    }
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('SW: Network error, no cached version:', error);
    throw error;
  }
}

// Стратегия: Network First с Cache Fallback
async function networkFirstWithCache(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Кешируем успешные ответы
      await cache.put(request, response.clone());
      await limitCacheSize(cacheName, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return response;
  } catch (error) {
    console.log('SW: Network failed, trying cache:', error);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Добавляем заголовок что данные из кеша
      const response = cachedResponse.clone();
      response.headers.set('X-Served-By', 'sw-cache');
      return response;
    }
    
    throw error;
  }
}

// Стратегия: Network First
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('SW: Network request failed:', error);
    throw error;
  }
}

// Стратегия: Network Only
async function networkOnly(request) {
  return fetch(request);
}

// Стратегия: Network First с Offline страницей
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Если офлайн, возвращаем кешированную главную страницу
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Если нет кешированной версии, создаем простую офлайн страницу
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SuperFacts - Офлайн</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-icon { font-size: 60px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>Vous êtes hors ligne</h1>
          <p>SuperFacts n'est pas disponible en ce moment.</p>
          <p>Vérifiez votre connexion Internet et réessayez.</p>
          <button onclick="location.reload()">Réessayer</button>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        'X-Served-By': 'sw-offline'
      }
    });
  }
}

// Ограничение размера кеша
async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Удаляем старые записи (FIFO)
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(
      keysToDelete.map(key => cache.delete(key))
    );
  }
}

// Push уведомления
self.addEventListener('push', event => {
  console.log('SW: Push received');
  
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    tag: data.tag || 'news-update',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Lire l\'article',
        icon: '/icons/action-read.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: data.url,
      articleId: data.articleId
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Клик по уведомлению
self.addEventListener('notificationclick', event => {
  console.log('SW: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Проверяем, есть ли уже открытая вкладка
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Открываем новую вкладку
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Синхронизация в фоне
self.addEventListener('sync', event => {
  console.log('SW: Background sync triggered', event.tag);
  
  if (event.tag === 'news-sync') {
    event.waitUntil(syncNews());
  }
});

async function syncNews() {
  try {
    const response = await fetch('/api/news?limit=10');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/news?limit=10', response);
      console.log('SW: News synced successfully');
    }
  } catch (error) {
    console.log('SW: Background sync failed:', error);
  }
}

// Периодическая синхронизация (если поддерживается)
self.addEventListener('periodicsync', event => {
  console.log('SW: Periodic sync triggered', event.tag);
  
  if (event.tag === 'news-refresh') {
    event.waitUntil(syncNews());
  }
});
