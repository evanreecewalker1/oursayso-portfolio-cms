// Enhanced Service Worker for Cloudinary Media Caching
// Optimized for iPad offline experience

const CACHE_NAME = 'portfolio-cloudinary-v1';
const STATIC_CACHE_NAME = 'portfolio-static-v1';
const MEDIA_CACHE_NAME = 'cloudinary-media-v1';
const API_CACHE_NAME = 'cloudinary-api-v1';

// Cache size limits (for 15GB total storage)
const CACHE_LIMITS = {
  media: 12 * 1024 * 1024 * 1024, // 12GB for media
  static: 512 * 1024 * 1024,      // 512MB for static assets
  api: 256 * 1024 * 1024          // 256MB for API responses
};

// URLs to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Cloudinary domains to cache
const CLOUDINARY_DOMAINS = [
  'res.cloudinary.com',
  'cloudinary.com'
];

// Installation
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME)
        .then(cache => cache.addAll(STATIC_ASSETS)),
      
      // Initialize media cache
      caches.open(MEDIA_CACHE_NAME),
      
      // Initialize API cache
      caches.open(API_CACHE_NAME)
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting();
    })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== MEDIA_CACHE_NAME && 
                cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Fetch handler with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle different request types with appropriate strategies
  if (isCloudinaryRequest(url)) {
    event.respondWith(handleCloudinaryRequest(event.request));
  } else if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(event.request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(event.request));
  } else {
    event.respondWith(handleDefaultRequest(event.request));
  }
});

// Check if request is for Cloudinary media
function isCloudinaryRequest(url) {
  return CLOUDINARY_DOMAINS.some(domain => url.hostname.includes(domain));
}

// Check if request is for API
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         url.hostname.includes('api.cloudinary.com');
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/static/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.ico') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.svg');
}

// Handle Cloudinary media requests with aggressive caching
async function handleCloudinaryRequest(request) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  
  try {
    // Try cache first (cache-first strategy for media)
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Cache hit for media:', request.url);
      
      // Background update for expired resources
      if (shouldUpdateInBackground(cachedResponse)) {
        updateMediaInBackground(request, cache);
      }
      
      return cachedResponse;
    }
    
    // Fetch from network
    console.log('🌐 Fetching media from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseToCache = networkResponse.clone();
      
      // Check cache size before storing
      const canCache = await checkCacheSize(MEDIA_CACHE_NAME, CACHE_LIMITS.media);
      if (canCache) {
        await cache.put(request, responseToCache);
        console.log('💾 Cached media:', request.url);
      } else {
        console.warn('⚠️ Media cache full, cannot cache:', request.url);
        await evictOldestMedia();
        await cache.put(request, responseToCache);
      }
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Failed to fetch media:', request.url, error);
    
    // Return cached version if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Fallback to cache for:', request.url);
      return cachedResponse;
    }
    
    // Return offline placeholder for images
    if (request.url.includes('image/')) {
      return createOfflinePlaceholder();
    }
    
    throw error;
  }
}

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Network first for API requests
    console.log('🌐 Fetching API from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // Cache successful GET responses
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('💾 Cached API response:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ API request failed:', request.url, error);
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('📦 Fallback to cached API response:', request.url);
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  
  try {
    // Cache first for static assets
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('📦 Cache hit for static asset:', request.url);
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
      console.log('💾 Cached static asset:', request.url);
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('❌ Failed to fetch static asset:', request.url, error);
    throw error;
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.error('❌ Default request failed:', request.url, error);
    throw error;
  }
}

// Check if cached response should be updated in background
function shouldUpdateInBackground(response) {
  const cacheDate = new Date(response.headers.get('date') || '');
  const now = new Date();
  const hoursSinceCache = (now - cacheDate) / (1000 * 60 * 60);
  
  // Update media older than 24 hours
  return hoursSinceCache > 24;
}

// Update media in background
async function updateMediaInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse);
      console.log('🔄 Background updated media:', request.url);
    }
  } catch (error) {
    console.warn('⚠️ Background update failed:', request.url, error);
  }
}

// Check cache size against limit
async function checkCacheSize(cacheName, limit) {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return estimate.usage < limit;
    }
    return true; // Allow caching if can't estimate
  } catch (error) {
    console.warn('⚠️ Could not estimate storage:', error);
    return true;
  }
}

// Evict oldest media to free up space
async function evictOldestMedia() {
  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const requests = await cache.keys();
    
    // Sort by date (oldest first)
    const sortedRequests = requests.sort((a, b) => {
      const aDate = new Date(a.headers.get('date') || '0');
      const bDate = new Date(b.headers.get('date') || '0');
      return aDate - bDate;
    });
    
    // Remove oldest 10% of cached media
    const toRemove = Math.max(1, Math.floor(sortedRequests.length * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      await cache.delete(sortedRequests[i]);
      console.log('🗑️ Evicted old media:', sortedRequests[i].url);
    }
    
  } catch (error) {
    console.error('❌ Failed to evict old media:', error);
  }
}

// Create offline placeholder for images
function createOfflinePlaceholder() {
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f0f0f0"/>
      <text x="200" y="150" text-anchor="middle" fill="#999" font-family="Arial" font-size="16">
        Offline - Image Not Available
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache'
    }
  });
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_MEDIA') {
    handleCacheMediaRequest(event.data.urls);
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    handleClearCacheRequest(event.data.cacheType);
  } else if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    handleGetCacheSizeRequest();
  }
});

// Cache specific media URLs
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
  
  // Send results back to main thread
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
  try {
    const cacheName = cacheType === 'media' ? MEDIA_CACHE_NAME :
                      cacheType === 'static' ? STATIC_CACHE_NAME :
                      cacheType === 'api' ? API_CACHE_NAME : null;
    
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('🗑️ Cleared cache:', cacheName);
      
      // Recreate cache
      await caches.open(cacheName);
    }
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
}

// Get cache size information
async function handleGetCacheSizeRequest() {
  try {
    const estimate = await navigator.storage.estimate();
    const cacheNames = await caches.keys();
    const cacheSizes = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheSizes[cacheName] = keys.length;
    }
    
    // Send results back
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'CACHE_SIZE_INFO',
        data: {
          total: estimate.usage,
          quota: estimate.quota,
          caches: cacheSizes
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to get cache size:', error);
  }
}

console.log('🎯 Enhanced Cloudinary Service Worker loaded successfully');