// Progressive Loading and Offline Media Management
import CloudinaryService from './cloudinaryConfig';

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.cacheQueue = [];
    this.preloadQueue = [];
    this.offlineStorage = 'portfolio-offline-data';
    this.serviceWorker = null;
    
    // Initialize
    this.init();
  }

  async init() {
    // Register service worker
    await this.registerServiceWorker();
    
    // Set up online/offline listeners
    this.setupNetworkListeners();
    
    // Start background caching
    this.startBackgroundCaching();
    
    // Load offline data
    this.loadOfflineData();
    
    console.log('🏠 Offline Manager initialized');
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-cloudinary.js');
        
        registration.addEventListener('updatefound', () => {
          console.log('🔄 Service Worker update found');
        });

        if (registration.active) {
          this.serviceWorker = registration.active;
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
        
        console.log('✅ Service Worker registered successfully');
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Back online');
      this.isOnline = true;
      this.syncOfflineChanges();
      this.resumeBackgroundCaching();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Gone offline');
      this.isOnline = false;
      this.pauseBackgroundCaching();
    });
  }

  // Intelligent progressive loading based on viewport and user behavior
  async progressiveLoad(mediaItems, options = {}) {
    const {
      priority = 'normal', // 'high', 'normal', 'low'
      preloadNext = 3,     // Number of items to preload ahead
      quality = 'auto'     // Image/video quality
    } = options;

    console.log(`📈 Progressive loading ${mediaItems.length} items (priority: ${priority})`);

    // Sort items by priority
    const prioritizedItems = this.prioritizeMedia(mediaItems, priority);
    
    // Load critical items immediately
    const criticalItems = prioritizedItems.slice(0, 2);
    await this.loadMediaBatch(criticalItems, 'high');

    // Load remaining items progressively
    const remainingItems = prioritizedItems.slice(2);
    this.scheduleProgressiveLoading(remainingItems, preloadNext);

    return prioritizedItems;
  }

  prioritizeMedia(mediaItems, priority) {
    return mediaItems.map(item => ({
      ...item,
      loadPriority: this.calculateLoadPriority(item, priority)
    })).sort((a, b) => b.loadPriority - a.loadPriority);
  }

  calculateLoadPriority(item, basePriority) {
    let priority = 0;
    
    // Base priority
    switch (basePriority) {
      case 'high': priority += 100; break;
      case 'normal': priority += 50; break;
      case 'low': priority += 10; break;
    }
    
    // Media type priority (images load faster)
    if (item.resourceType === 'image') {
      priority += 30;
    } else if (item.resourceType === 'video') {
      priority += 20;
    }
    
    // Size priority (smaller files first)
    if (item.bytes) {
      const sizeMB = item.bytes / (1024 * 1024);
      if (sizeMB < 1) priority += 20;
      else if (sizeMB < 5) priority += 10;
      else if (sizeMB > 50) priority -= 20;
    }
    
    // Recently accessed items get higher priority
    const lastAccessed = this.getLastAccessed(item.publicId);
    if (lastAccessed) {
      const hoursSince = (Date.now() - lastAccessed) / (1000 * 60 * 60);
      if (hoursSince < 1) priority += 15;
      else if (hoursSince < 24) priority += 5;
    }
    
    return priority;
  }

  async loadMediaBatch(items, quality = 'auto') {
    const batchPromises = items.map(async (item) => {
      try {
        const urls = await this.getOptimizedUrls(item, quality);
        
        // Cache URLs through service worker
        if (this.serviceWorker) {
          this.serviceWorker.postMessage({
            type: 'CACHE_MEDIA',
            urls: urls.map(u => typeof u === 'string' ? u : u.url)
          });
        }
        
        // Store metadata
        this.storeMediaMetadata(item, urls);
        
        return { item, urls, status: 'loaded' };
      } catch (error) {
        console.warn('Failed to load media item:', item.publicId, error);
        return { item, status: 'failed', error };
      }
    });

    const results = await Promise.allSettled(batchPromises);
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

    console.log(`📊 Batch load: ${successful.length} successful, ${failed.length} failed`);
    return successful;
  }

  scheduleProgressiveLoading(items, preloadCount) {
    // Use Intersection Observer for viewport-based loading
    if ('IntersectionObserver' in window) {
      this.setupViewportLoading(items);
    }
    
    // Use requestIdleCallback for background preloading
    if ('requestIdleCallback' in window) {
      this.scheduleBackgroundPreload(items, preloadCount);
    } else {
      // Fallback for Safari
      setTimeout(() => this.scheduleBackgroundPreload(items, preloadCount), 100);
    }
  }

  setupViewportLoading(items) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const itemId = entry.target.dataset.itemId;
          const item = items.find(i => i.id === itemId);
          if (item && !item.loaded) {
            this.loadMediaBatch([item], 'auto');
            item.loaded = true;
          }
        }
      });
    }, {
      rootMargin: '50px' // Start loading 50px before item comes into view
    });

    // This would be called from the component that renders media
    return observer;
  }

  scheduleBackgroundPreload(items, count) {
    const preload = (deadline) => {
      let processed = 0;
      
      while (deadline.timeRemaining() > 0 && processed < count && items.length > 0) {
        const item = items.shift();
        if (item && !item.loaded) {
          this.loadMediaBatch([item], 'low');
          item.loaded = true;
          processed++;
        }
      }
      
      if (items.length > 0 && processed < count) {
        requestIdleCallback(preload);
      }
    };
    
    requestIdleCallback(preload);
  }

  async getOptimizedUrls(item, quality) {
    if (item.resourceType === 'video') {
      return CloudinaryService.getOptimizedVideoUrl(item.publicId, {
        responsive: true,
        quality: quality
      });
    } else {
      return CloudinaryService.getOptimizedImageUrl(item.publicId, {
        responsive: true,
        width: 1280,
        quality: quality
      });
    }
  }

  // Offline data management
  storeMediaMetadata(item, urls) {
    const offlineData = this.getOfflineData();
    offlineData.media = offlineData.media || {};
    
    offlineData.media[item.publicId] = {
      ...item,
      urls,
      cachedAt: Date.now(),
      lastAccessed: Date.now()
    };
    
    this.saveOfflineData(offlineData);
  }

  getOfflineData() {
    try {
      const data = localStorage.getItem(this.offlineStorage);
      return data ? JSON.parse(data) : { media: {}, projects: {}, settings: {} };
    } catch (error) {
      console.warn('Failed to load offline data:', error);
      return { media: {}, projects: {}, settings: {} };
    }
  }

  saveOfflineData(data) {
    try {
      localStorage.setItem(this.offlineStorage, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save offline data:', error);
      
      // Try to free up space if quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.cleanupOfflineData();
        // Retry save
        try {
          localStorage.setItem(this.offlineStorage, JSON.stringify(data));
        } catch (retryError) {
          console.error('Failed to save even after cleanup:', retryError);
        }
      }
    }
  }

  loadOfflineData() {
    const offlineData = this.getOfflineData();
    console.log(`📱 Loaded offline data: ${Object.keys(offlineData.media || {}).length} media items`);
    return offlineData;
  }

  cleanupOfflineData() {
    const offlineData = this.getOfflineData();
    const media = offlineData.media || {};
    
    // Remove items older than 30 days
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const cleanedMedia = {};
    
    Object.entries(media).forEach(([publicId, item]) => {
      if (item.lastAccessed > thirtyDaysAgo) {
        cleanedMedia[publicId] = item;
      }
    });
    
    const removedCount = Object.keys(media).length - Object.keys(cleanedMedia).length;
    console.log(`🧹 Cleaned up ${removedCount} old offline items`);
    
    offlineData.media = cleanedMedia;
    this.saveOfflineData(offlineData);
  }

  // Background caching management
  startBackgroundCaching() {
    this.backgroundCacheInterval = setInterval(() => {
      if (this.isOnline && this.cacheQueue.length > 0) {
        this.processBackgroundCache();
      }
    }, 30000); // Process every 30 seconds
  }

  pauseBackgroundCaching() {
    if (this.backgroundCacheInterval) {
      clearInterval(this.backgroundCacheInterval);
      this.backgroundCacheInterval = null;
    }
  }

  resumeBackgroundCaching() {
    if (!this.backgroundCacheInterval) {
      this.startBackgroundCaching();
    }
  }

  async processBackgroundCache() {
    const batchSize = 3; // Process 3 items at a time
    const batch = this.cacheQueue.splice(0, batchSize);
    
    if (batch.length > 0) {
      console.log(`🔄 Processing background cache batch: ${batch.length} items`);
      await this.loadMediaBatch(batch, 'low');
    }
  }

  // Add items to background cache queue
  queueForCaching(items) {
    this.cacheQueue.push(...items.filter(item => !this.isMediaCached(item.publicId)));
    console.log(`📥 Queued ${items.length} items for background caching`);
  }

  isMediaCached(publicId) {
    const offlineData = this.getOfflineData();
    return !!(offlineData.media && offlineData.media[publicId]);
  }

  getLastAccessed(publicId) {
    const offlineData = this.getOfflineData();
    return offlineData.media && offlineData.media[publicId] ? offlineData.media[publicId].lastAccessed : null;
  }

  updateLastAccessed(publicId) {
    const offlineData = this.getOfflineData();
    if (offlineData.media && offlineData.media[publicId]) {
      offlineData.media[publicId].lastAccessed = Date.now();
      this.saveOfflineData(offlineData);
    }
  }

  // Sync offline changes when back online
  async syncOfflineChanges() {
    const offlineData = this.getOfflineData();
    const pendingChanges = offlineData.pendingChanges || [];
    
    if (pendingChanges.length > 0) {
      console.log(`🔄 Syncing ${pendingChanges.length} offline changes`);
      
      for (const change of pendingChanges) {
        try {
          await this.syncChange(change);
        } catch (error) {
          console.error('Failed to sync change:', change, error);
        }
      }
      
      // Clear pending changes
      offlineData.pendingChanges = [];
      this.saveOfflineData(offlineData);
    }
  }

  async syncChange(change) {
    // Implement specific sync logic based on change type
    switch (change.type) {
      case 'upload':
        // Re-attempt failed uploads
        break;
      case 'delete':
        // Sync deletions
        break;
      case 'update':
        // Sync updates
        break;
    }
  }

  // Service Worker message handler
  handleServiceWorkerMessage(event) {
    const { data } = event;
    
    switch (data.type) {
      case 'CACHE_MEDIA_COMPLETE':
        console.log('📦 Service Worker cache complete:', data.results);
        break;
      case 'CACHE_SIZE_INFO':
        console.log('📊 Cache size info:', data.data);
        break;
    }
  }

  // Public API methods
  async preloadProjectMedia(project) {
    const mediaItems = this.extractMediaFromProject(project);
    await this.progressiveLoad(mediaItems, { priority: 'high', preloadNext: 5 });
  }

  extractMediaFromProject(project) {
    const mediaItems = [];
    
    // Extract tile backgrounds
    if (project.backgrounds?.tile?.file?.cloudinaryId) {
      mediaItems.push({
        publicId: project.backgrounds.tile.file.cloudinaryId,
        resourceType: project.backgrounds.tile.type === 'video' ? 'video' : 'image',
        bytes: project.backgrounds.tile.file.size
      });
    }
    
    // Extract page backgrounds
    if (project.backgrounds?.page?.cloudinaryId) {
      mediaItems.push({
        publicId: project.backgrounds.page.cloudinaryId,
        resourceType: 'image',
        bytes: project.backgrounds.page.size
      });
    }
    
    // Extract media items
    if (project.mediaItems) {
      project.mediaItems.forEach(item => {
        item.files?.forEach(file => {
          if (file.cloudinaryId) {
            mediaItems.push({
              publicId: file.cloudinaryId,
              resourceType: item.type === 'video' ? 'video' : 'image',
              bytes: file.size
            });
          }
        });
      });
    }
    
    return mediaItems;
  }

  // Cache management
  async getCacheInfo() {
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({ type: 'GET_CACHE_SIZE' });
    }
  }

  async clearCache(type = 'all') {
    if (this.serviceWorker) {
      if (type === 'all') {
        ['media', 'static', 'api'].forEach(cacheType => {
          this.serviceWorker.postMessage({ type: 'CLEAR_CACHE', cacheType });
        });
      } else {
        this.serviceWorker.postMessage({ type: 'CLEAR_CACHE', cacheType: type });
      }
    }
    
    // Also clear offline data if requested
    if (type === 'all' || type === 'offline') {
      localStorage.removeItem(this.offlineStorage);
      console.log('🗑️ Cleared offline data');
    }
  }

  // Cleanup on app close
  cleanup() {
    this.pauseBackgroundCaching();
    console.log('🧹 Offline Manager cleaned up');
  }
}

export default new OfflineManager();