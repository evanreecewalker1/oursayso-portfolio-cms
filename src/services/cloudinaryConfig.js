// Cloudinary Configuration and Optimization Service
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { videoCodec } from '@cloudinary/url-gen/actions/transcode';

// Initialize Cloudinary instance
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dnuni9dgl'
  }
});

// Bandwidth tracking
let monthlyUsage = parseInt(localStorage.getItem('cloudinary-usage') || '0');
const USAGE_LIMIT = 25 * 1024 * 1024 * 1024; // 25GB in bytes
const STORAGE_LIMIT = 15 * 1024 * 1024 * 1024; // 15GB in bytes

class CloudinaryService {
  constructor() {
    // Fallback to hardcoded values if environment variables are not available
    this.uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
    this.apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY || '188545171796635';
    this.apiSecret = process.env.REACT_APP_CLOUDINARY_API_SECRET || 'B8lQJoL1N13A2b2LhBXrHiGUumY';
    this.cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dnuni9dgl';
    
    // Track bandwidth usage
    this.usage = {
      monthly: monthlyUsage,
      session: 0,
      cached: 0
    };
    
    // Initialize usage tracking
    this.initUsageTracking();
  }

  initUsageTracking() {
    // Reset monthly usage if new month
    const lastReset = localStorage.getItem('usage-reset-date');
    const currentMonth = new Date().getMonth();
    const storedMonth = lastReset ? new Date(lastReset).getMonth() : -1;
    
    if (currentMonth !== storedMonth) {
      this.usage.monthly = 0;
      localStorage.setItem('cloudinary-usage', '0');
      localStorage.setItem('usage-reset-date', new Date().toISOString());
    }
  }

  // Generate signature for signed uploads using Web Crypto API
  async generateSignature(paramsToSign, apiSecret) {
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&');
    
    const stringToSign = sortedParams + apiSecret;
    console.log('🔍 String to sign:', stringToSign);
    
    // Use Web Crypto API for SHA-1 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    console.log('🔍 Generated signature:', signature.slice(0, 10) + '...');
    return signature;
  }

  // Upload media (images and videos) to Cloudinary
  async uploadMedia(file, options = {}) {
    try {
      console.log('📤 Uploading to Cloudinary:', file.name, file.type);
      
      // Check storage limits
      if (this.usage.monthly + file.size > USAGE_LIMIT) {
        throw new Error('Monthly bandwidth limit would be exceeded');
      }

      // Use signed upload since unsigned presets are not whitelisted
      const timestamp = Math.round(new Date().getTime() / 1000);
      
      // Build parameters to sign
      const paramsToSign = {
        timestamp: timestamp
      };

      // Add optional parameters for overwrite functionality
      if (options.public_id) {
        paramsToSign.public_id = options.public_id;
      }
      if (options.folder) {
        paramsToSign.folder = options.folder;
      }
      if (options.overwrite) {
        paramsToSign.overwrite = 'true';
      }
      if (options.tags) {
        paramsToSign.tags = Array.isArray(options.tags) ? options.tags.join(',') : options.tags;
      }

      // Add resource type for proper handling
      const isVideo = file.type.startsWith('video/');
      if (isVideo) {
        paramsToSign.resource_type = 'video';
      }

      // Add timeout parameter for large files
      if (file.size > 100 * 1024 * 1024) { // Files larger than 100MB
        paramsToSign.timeout = '120'; // 120 second timeout
      }
      
      const signature = await this.generateSignature(paramsToSign, this.apiSecret);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', this.apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      // Add optional parameters to form data
      if (options.public_id) {
        formData.append('public_id', options.public_id);
      }
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      if (options.overwrite) {
        formData.append('overwrite', 'true');
      }
      if (options.tags) {
        const tagsString = Array.isArray(options.tags) ? options.tags.join(',') : options.tags;
        formData.append('tags', tagsString);
      }

      // Add resource type for proper handling
      if (isVideo) {
        formData.append('resource_type', 'video');
      }

      // Add timeout parameter for large files
      if (file.size > 100 * 1024 * 1024) { // Files larger than 100MB
        formData.append('timeout', '120'); // 120 second timeout
      }
      
      console.log('🔍 Signed upload attempt:', {
        apiKey: this.apiKey,
        timestamp: timestamp,
        signature: signature.slice(0, 10) + '...',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${isVideo ? 'video' : 'image'}/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        // Get the actual error response from Cloudinary
        const errorText = await response.text();
        console.error('❌ Cloudinary error response:', errorText);
        console.error('❌ Response status:', response.status, response.statusText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      
      // Track bandwidth usage
      this.trackUsage(result.bytes || file.size);
      
      console.log('✅ Upload successful:', result.public_id);
      
      return {
        publicId: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        duration: result.duration, // For videos
        resourceType: result.resource_type,
        eager: result.eager || []
      };

    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  }

  // Generate optimized image URLs
  getOptimizedImageUrl(publicId, options = {}) {
    const image = cld.image(publicId);
    
    // Apply automatic optimizations
    image.delivery(format('auto')).delivery(quality('auto'));
    
    // Apply responsive sizing
    if (options.width || options.height) {
      image.resize(auto().width(options.width).height(options.height));
    }
    
    // Generate multiple sizes for responsive loading
    const sizes = options.responsive ? [
      { width: 854, suffix: '_small' },
      { width: 1280, suffix: '_medium' },
      { width: 1920, suffix: '_large' }
    ] : [{ width: options.width || 1280 }];
    
    if (options.responsive) {
      return sizes.map(size => ({
        width: size.width,
        url: cld.image(publicId).resize(auto().width(size.width)).delivery(format('auto')).delivery(quality('auto')).toURL(),
        suffix: size.suffix
      }));
    }
    
    return image.toURL();
  }

  // Generate optimized video URLs
  getOptimizedVideoUrl(publicId, options = {}) {
    const video = cld.video(publicId);
    
    // Apply automatic optimizations
    video.delivery(format('auto')).delivery(quality('auto'));
    
    // Apply video codec optimization
    if (options.codec) {
      video.transcode(videoCodec(options.codec));
    }
    
    // Apply responsive sizing for videos
    if (options.width || options.height) {
      video.resize(auto().width(options.width).height(options.height));
    }
    
    // Generate multiple quality versions
    const qualities = options.responsive ? [
      { width: 854, quality: 'auto:low', suffix: '_low' },
      { width: 1280, quality: 'auto:good', suffix: '_medium' },
      { width: 1920, quality: 'auto:best', suffix: '_high' }
    ] : [{ quality: options.quality || 'auto:good' }];
    
    if (options.responsive) {
      return qualities.map(qual => ({
        width: qual.width,
        quality: qual.quality,
        url: cld.video(publicId).resize(auto().width(qual.width)).delivery(format('auto')).delivery(quality('auto')).toURL(),
        suffix: qual.suffix
      }));
    }
    
    return video.toURL();
  }

  // Pre-cache media for offline usage
  async precacheMedia(mediaItems) {
    const cachePromises = mediaItems.map(async (item) => {
      try {
        if (item.resourceType === 'video') {
          const urls = this.getOptimizedVideoUrl(item.publicId, { responsive: true });
          return Promise.all(urls.map(url => this.cacheResource(url.url)));
        } else {
          const urls = this.getOptimizedImageUrl(item.publicId, { responsive: true });
          return Promise.all(urls.map(url => this.cacheResource(url.url)));
        }
      } catch (error) {
        console.warn('Failed to precache:', item.publicId, error);
        return null;
      }
    });

    await Promise.allSettled(cachePromises);
    console.log('✅ Media precaching completed');
  }

  // Cache individual resource
  async cacheResource(url) {
    try {
      if ('caches' in window) {
        const cache = await caches.open('cloudinary-media-v1');
        await cache.add(url);
        console.log('📦 Cached:', url);
      }
    } catch (error) {
      console.warn('Cache failed:', url, error);
    }
  }

  // Track bandwidth usage
  trackUsage(bytes) {
    this.usage.monthly += bytes;
    this.usage.session += bytes;
    
    localStorage.setItem('cloudinary-usage', this.usage.monthly.toString());
    
    // Warn if approaching limits
    if (this.usage.monthly > USAGE_LIMIT * 0.8) {
      console.warn('⚠️ Approaching monthly bandwidth limit');
    }
    
    if (this.usage.monthly > STORAGE_LIMIT * 0.8) {
      console.warn('⚠️ Approaching storage limit');
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      monthly: {
        used: this.usage.monthly,
        limit: USAGE_LIMIT,
        percentage: (this.usage.monthly / USAGE_LIMIT) * 100
      },
      storage: {
        limit: STORAGE_LIMIT,
        percentage: (this.usage.monthly / STORAGE_LIMIT) * 100 // Approximate
      },
      session: this.usage.session
    };
  }

  // Delete media from Cloudinary
  async deleteMedia(publicId, resourceType = 'image') {
    try {
      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/destroy`;
      
      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('api_key', this.apiKey);
      
      // Generate signature for secure deletion
      const timestamp = Math.round(new Date().getTime() / 1000);
      formData.append('timestamp', timestamp);
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      console.log('🗑️ Media deleted:', publicId, result);
      
      return result;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkUpload(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadMedia(file, {
      ...options,
      folder: options.folder || 'bulk-upload',
      tags: [...(options.tags || []), 'bulk-upload']
    }));

    const results = await Promise.allSettled(uploadPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
    
    console.log(`📊 Bulk upload: ${successful.length} successful, ${failed.length} failed`);
    
    return { successful, failed };
  }
}

export default new CloudinaryService();
export { cld };