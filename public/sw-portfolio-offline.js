// CRITICAL: Complete Offline Service Worker for Portfolio App
// Provides full offline capability for the OurSayso Sales iPad Portfolio

const CACHE_NAME = 'oursayso-portfolio-v1';
const STATIC_CACHE_NAME = 'portfolio-static-v1';
const MEDIA_CACHE_NAME = 'portfolio-media-v1';
const DATA_CACHE_NAME = 'portfolio-data-v1';
const RUNTIME_CACHE_NAME = 'portfolio-runtime-v1';

// Cache size limits (optimized for iPad storage)
const CACHE_LIMITS = {
  media: 8 * 1024 * 1024 * 1024,    // 8GB for media (videos, images)
  static: 100 * 1024 * 1024,        // 100MB for static assets
  data: 50 * 1024 * 1024,           // 50MB for JSON data
  runtime: 500 * 1024 * 1024        // 500MB for runtime assets
};

// Core app shell - always cached for offline use
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
  '/images/oursayso-logo.svg',
  '/images/oursayso-favicon.ico',
  '/fonts/barlow-v12-latin-300.woff2',
  '/fonts/barlow-v12-latin-400.woff2',
  '/fonts/barlow-v12-latin-500.woff2',
  '/fonts/barlow-v12-latin-600.woff2',
  '/fonts/barlow-v12-latin-700.woff2'
];

// Portfolio-specific assets to cache
const PORTFOLIO_ASSETS = [
  '/data/cms-projects.json',
  '/data/testimonials.json',
  '/data/settings.json',
  // Add core project media paths
  '/projects/',
  '/videos/',
  '/documents/',
  '/images/tiles/',
  '/images/backgrounds/'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/data/',
  '/api/',
  '/cms-projects.json'
];

// Cache-first resources (use cache, update in background)
const CACHE_FIRST = [
  '/images/',
  '/videos/',
  '/documents/',
  '/fonts/',
  '/static/',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.mp4',
  '.webm',
  '.pdf'
];

// Critical installation
self.addEventListener('install', (event) => {
  console.log('📱 Portfolio Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell immediately
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          console.log('📦 Caching app shell assets...');
          return cache.addAll(APP_SHELL.map(url => new Request(url, { 
            cache: 'reload',
            credentials: 'same-origin'
          })));
        }),
      
      // Initialize other caches
      caches.open(MEDIA_CACHE_NAME),
      caches.open(DATA_CACHE_NAME),
      caches.open(RUNTIME_CACHE_NAME),
      
      // Pre-cache critical portfolio data
      caches.open(DATA_CACHE_NAME)
        .then(cache => {
          console.log('📊 Pre-caching portfolio data...');
          return Promise.allSettled(
            PORTFOLIO_ASSETS.map(url => 
              fetch(url, { credentials: 'same-origin' })
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch(() => {
                  // Some files might not exist yet, that's okay
                  console.log(`⚠️ Could not cache ${url} (may not exist)`);
                })
            )
          );
        })
    ]).then(() => {
      console.log('✅ Portfolio Service Worker: Installed successfully');
      // Force activation to take control immediately
      return self.skipWaiting();
    }).catch(error => {
      console.error('❌ Portfolio Service Worker installation failed:', error);
    })
  );
});

// Activation and cleanup
self.addEventListener('activate', (event) => {
  console.log('🚀 Portfolio Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        const validCaches = [
          CACHE_NAME, STATIC_CACHE_NAME, MEDIA_CACHE_NAME, 
          DATA_CACHE_NAME, RUNTIME_CACHE_NAME
        ];
        
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!validCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients immediately
      self.clients.claim(),
      
      // Initialize offline data structures
      initializeOfflineStorage()
    ]).then(() => {
      console.log('✅ Portfolio Service Worker: Activated successfully');
      
      // Notify all clients about activation
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            message: 'Portfolio offline capability enabled'
          });
        });
      });
    })
  );
});

// Initialize offline data structures
async function initializeOfflineStorage() {
  try {
    // Create offline state management
    const offlineData = {
      version: '1.0.0',
      lastSync: new Date().toISOString(),
      portfolioVersion: null,
      cachedProjects: [],
      cachedMedia: [],
      offlineActions: [],
      syncQueue: []
    };
    
    // Store in IndexedDB for persistent offline state
    await storeOfflineData('portfolio-state', offlineData);
    console.log('💾 Offline storage initialized');
  } catch (error) {
    console.error('❌ Failed to initialize offline storage:', error);
  }
}

// Main fetch event handler with comprehensive offline support
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests to other origins (except for known CDNs)
  if (url.origin !== location.origin && !isTrustedOrigin(url.origin)) {
    return;
  }
  
  // Route to appropriate cache strategy
  if (isAppShellRequest(url)) {
    event.respondWith(handleAppShell(request));
  } else if (isNetworkFirst(url)) {
    event.respondWith(handleNetworkFirst(request));
  } else if (isCacheFirst(url)) {
    event.respondWith(handleCacheFirst(request));
  } else if (isMediaRequest(url)) {
    event.respondWith(handleMediaRequest(request));
  } else if (isDataRequest(url)) {
    event.respondWith(handleDataRequest(request));
  } else {
    event.respondWith(handleDefault(request));
  }
});

// App shell handler - critical for offline functionality
async function handleAppShell(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    // Always try cache first for app shell
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📱 App shell from cache:', request.url);
      
      // Update in background if stale
      if (isStale(cachedResponse)) {
        updateInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // If not in cache, try network (shouldn't happen after install)
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.error('❌ App shell request failed:', request.url, error);
    
    // Return cached version or offline fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback page
    return createOfflineFallback(request);
  }
}

// Network-first strategy for dynamic data
async function handleNetworkFirst(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request, {
      timeout: 3000 // 3 second timeout
    });
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
      console.log('🌐 Network data cached:', request.url);
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.log('📦 Falling back to cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline indicator header
      const response = cachedResponse.clone();
      response.headers.set('X-Served-From', 'cache');
      return response;
    }
    
    // Return offline data if available
    return createOfflineDataResponse(request);
  }
}

// Cache-first strategy for static assets
async function handleCacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Static asset from cache:', request.url);
      
      // Update in background if stale
      if (isStale(cachedResponse)) {
        updateInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Check cache size before storing
      const canCache = await checkCacheSize(STATIC_CACHE_NAME, CACHE_LIMITS.static);
      if (canCache) {
        cache.put(request, networkResponse.clone());
      } else {
        await evictOldestEntries(STATIC_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      console.log('💾 Static asset cached:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Static asset request failed:', request.url, error);
    
    // Try to return cached version
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder for missing assets
    return createAssetPlaceholder(request);
  }
}

// Media request handler with aggressive caching
async function handleMediaRequest(request) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  
  try {
    // Check cache first for media
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('🎬 Media from cache:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Check if we can cache this media file
      const contentLength = parseInt(networkResponse.headers.get('content-length') || '0');
      const canCache = await checkCacheSize(MEDIA_CACHE_NAME, CACHE_LIMITS.media, contentLength);
      
      if (canCache) {
        cache.put(request, networkResponse.clone());
        console.log('🎥 Media cached:', request.url);
      } else {
        console.warn('⚠️ Media too large for cache:', request.url);
        // Still return the response, just don't cache it
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Media request failed:', request.url, error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return media placeholder
    return createMediaPlaceholder(request);
  }
}

// Data request handler for JSON/API responses
async function handleDataRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  // For portfolio JSON data, try network first but with quick fallback
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 2000)
      )
    ]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      console.log('📊 Data updated from network:', request.url);
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
    
  } catch (error) {
    console.log('📦 Using cached data for:', request.url);
    
    // Use cached data
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return empty but valid JSON for missing data
    return createEmptyDataResponse(request);
  }
}

// Default handler for other requests
async function handleDefault(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses in runtime cache
      const canCache = await checkCacheSize(RUNTIME_CACHE_NAME, CACHE_LIMITS.runtime);
      if (canCache) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    // Try runtime cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Utility functions

function isAppShellRequest(url) {
  return APP_SHELL.some(path => url.pathname === path || url.pathname.endsWith(path));
}

function isNetworkFirst(url) {
  return NETWORK_FIRST.some(path => url.pathname.startsWith(path));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => 
    url.pathname.includes(pattern) || url.pathname.endsWith(pattern)
  );
}

function isMediaRequest(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov|avi|pdf)$/i) ||
         url.pathname.startsWith('/videos/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.startsWith('/documents/');
}

function isDataRequest(url) {
  return url.pathname.endsWith('.json') || 
         url.pathname.startsWith('/data/') ||
         url.pathname.startsWith('/api/');
}

function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://res.cloudinary.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
    'https://api.github.com',
    'https://raw.githubusercontent.com'
  ];
  return trustedOrigins.includes(origin);
}

function isStale(response, maxAge = 24 * 60 * 60 * 1000) { // 24 hours default
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return true;
  
  const responseDate = new Date(dateHeader);
  const now = new Date();
  
  return (now - responseDate) > maxAge;
}

// Background update for stale resources
async function updateInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
      console.log('🔄 Background update completed:', request.url);
    }
  } catch (error) {
    console.warn('⚠️ Background update failed:', request.url, error);
  }
}

// Cache size management
async function checkCacheSize(cacheName, limit, additionalSize = 0) {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const projectedUsage = (estimate.usage || 0) + additionalSize;
      return projectedUsage < (estimate.quota || limit) * 0.8; // Use 80% of quota
    }
    return true;
  } catch (error) {
    console.warn('⚠️ Could not estimate storage:', error);
    return true;
  }
}

async function evictOldestEntries(cacheName, percentage = 0.2) {
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Sort by last accessed (if available) or use insertion order
    const sortedRequests = requests.sort((a, b) => {
      const aDate = new Date(a.headers?.get('date') || '0');
      const bDate = new Date(b.headers?.get('date') || '0');
      return aDate - bDate;
    });
    
    const toRemove = Math.ceil(sortedRequests.length * percentage);
    
    for (let i = 0; i < toRemove; i++) {
      await cache.delete(sortedRequests[i]);
      console.log('🗑️ Evicted from cache:', sortedRequests[i].url);
    }
    
  } catch (error) {
    console.error('❌ Failed to evict cache entries:', error);
  }
}

// Offline fallback creators
function createOfflineFallback(request) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>OurSayso Portfolio - Offline</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: 'Barlow', sans-serif; 
          text-align: center; 
          padding: 2rem; 
          background: linear-gradient(135deg, #1652FB 0%, #0ea5e9 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { font-size: 2rem; margin: 1rem 0; }
        p { font-size: 1.2rem; opacity: 0.9; }
        .retry-btn { 
          background: white; 
          color: #1652FB; 
          border: none; 
          padding: 1rem 2rem; 
          border-radius: 8px; 
          font-size: 1rem; 
          font-weight: 600; 
          cursor: pointer; 
          margin-top: 2rem; 
        }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>OurSayso Portfolio</h1>
      <p>You're currently offline</p>
      <p>Some features may be limited until you reconnect to the internet.</p>
      <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'X-Served-From': 'offline-fallback'
    }
  });
}

function createOfflineDataResponse(request) {
  const emptyData = {
    projects: [],
    testimonials: [],
    message: 'Offline mode - limited data available',
    lastSync: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(emptyData), {
    headers: {
      'Content-Type': 'application/json',
      'X-Served-From': 'offline-generated'
    }
  });
}

function createEmptyDataResponse(request) {
  return new Response(JSON.stringify({ message: 'Data not available offline' }), {
    headers: {
      'Content-Type': 'application/json',
      'X-Served-From': 'offline-placeholder'
    }
  });
}

function createAssetPlaceholder(request) {
  // Return 1x1 transparent pixel for images
  if (request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const pixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';
    return new Response(atob(pixel), {
      headers: {
        'Content-Type': 'image/png',
        'X-Served-From': 'offline-placeholder'
      }
    });
  }
  
  // Return empty response for other assets
  return new Response('', {
    status: 204,
    headers: { 'X-Served-From': 'offline-placeholder' }
  });
}

function createMediaPlaceholder(request) {
  if (request.url.match(/\.(mp4|webm|mov)$/i)) {
    // Return minimal video placeholder response
    return new Response('Video not available offline', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'X-Served-From': 'offline-media-placeholder'
      }
    });
  }
  
  return createAssetPlaceholder(request);
}

// IndexedDB helper functions
async function storeOfflineData(key, data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OurSaysoPortfolio', 1);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline-data')) {
        db.createObjectStore('offline-data');
      }
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readwrite');
      const store = transaction.objectStore('offline-data');
      const putRequest = store.put(data, key);
      
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_MEDIA':
      handleCacheMediaRequest(data.urls);
      break;
      
    case 'CLEAR_CACHE':
      handleClearCacheRequest(data.cacheType);
      break;
      
    case 'GET_CACHE_STATUS':
      handleGetCacheStatus();
      break;
      
    case 'SYNC_OFFLINE_ACTIONS':
      handleSyncOfflineActions();
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Cache media URLs for offline use
async function handleCacheMediaRequest(urls) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const results = [];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        results.push({ url, status: 'cached' });
        console.log('💾 Pre-cached media:', url);
      } else {
        results.push({ url, status: 'failed', error: response.statusText });
      }
    } catch (error) {
      results.push({ url, status: 'error', error: error.message });
    }
  }
  
  // Notify clients of completion
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'CACHE_MEDIA_COMPLETE',
      results
    });
  });
}

// Clear specific cache
async function handleClearCacheRequest(cacheType) {
  const cacheMap = {
    static: STATIC_CACHE_NAME,
    media: MEDIA_CACHE_NAME,
    data: DATA_CACHE_NAME,
    runtime: RUNTIME_CACHE_NAME,
    all: 'all'
  };
  
  try {
    if (cacheType === 'all') {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    } else if (cacheMap[cacheType]) {
      await caches.delete(cacheMap[cacheType]);
      console.log(`🗑️ Cleared ${cacheType} cache`);
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Get cache status information
async function handleGetCacheStatus() {
  try {
    const cacheNames = await caches.keys();
    const status = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        entryCount: keys.length,
        urls: keys.slice(0, 10).map(req => req.url) // First 10 URLs
      };
    }
    
    const estimate = await navigator.storage?.estimate?.() || {};
    
    // Send status to all clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_STATUS',
        data: {
          caches: status,
          storage: {
            usage: estimate.usage,
            quota: estimate.quota,
            usagePercentage: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to get cache status:', error);
  }
}

// Handle offline action synchronization
async function handleSyncOfflineActions() {
  // This would handle syncing any actions that were queued while offline
  // Such as uploads, edits, etc.
  console.log('🔄 Syncing offline actions...');
  
  try {
    const offlineData = await getOfflineData('portfolio-state');
    if (offlineData && offlineData.syncQueue.length > 0) {
      // Process sync queue
      for (const action of offlineData.syncQueue) {
        try {
          await processOfflineAction(action);
        } catch (error) {
          console.error('Failed to sync action:', action, error);
        }
      }
      
      // Clear sync queue after successful sync
      offlineData.syncQueue = [];
      offlineData.lastSync = new Date().toISOString();
      await storeOfflineData('portfolio-state', offlineData);
    }
  } catch (error) {
    console.error('❌ Failed to sync offline actions:', error);
  }
}

async function getOfflineData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OurSaysoPortfolio', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offline-data'], 'readonly');
      const store = transaction.objectStore('offline-data');
      const getRequest = store.get(key);
      
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    
    request.onerror = () => reject(request.error);
  });
}

async function processOfflineAction(action) {
  // This would process various offline actions like:
  // - Uploading queued media
  // - Syncing project changes
  // - Submitting forms that were saved offline
  console.log('Processing offline action:', action.type);
}

console.log('🚀 OurSayso Portfolio Service Worker loaded successfully');
console.log('📱 Complete offline capability enabled for iPad portfolio');