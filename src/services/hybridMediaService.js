// Hybrid Media Storage Service
// Routes images to Cloudinary and videos to local storage based on file type and size

import CloudinaryService from './cloudinaryConfig';
import LocalFileManager from './localFileManager';

class HybridMediaService {
  constructor() {
    // File type mappings
    this.imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    this.videoTypes = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'];
    
    // Size thresholds
    this.imageCloudinaryMaxSize = 10 * 1024 * 1024; // 10MB - large images go local
    this.videoLocalMaxSize = 500 * 1024 * 1024; // 500MB max for local videos
  }

  // Determine storage method based on file type and size
  getStorageMethod(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const fileSize = file.size;

    // Video files always go local (solves upload size issues)
    if (this.videoTypes.includes(extension)) {
      return {
        method: 'local',
        type: 'video',
        reason: 'Video files stored locally for offline capability and size flexibility'
      };
    }

    // Image files - check size threshold
    if (this.imageTypes.includes(extension)) {
      if (fileSize > this.imageCloudinaryMaxSize) {
        return {
          method: 'local',
          type: 'image',
          reason: `Large image (${this.formatFileSize(fileSize)}) stored locally`
        };
      }
      return {
        method: 'cloudinary',
        type: 'image',
        reason: 'Image optimized via Cloudinary CDN'
      };
    }

    // Unknown file types default to local
    return {
      method: 'local',
      type: 'unknown',
      reason: 'Unknown file type stored locally'
    };
  }

  // Upload media using appropriate storage method
  async uploadMedia(file, options = {}) {
    const storageDecision = this.getStorageMethod(file);
    
    console.log(`📁 Hybrid Upload Decision:`, {
      fileName: file.name,
      size: this.formatFileSize(file.size),
      storageMethod: storageDecision.method,
      reason: storageDecision.reason
    });

    try {
      if (storageDecision.method === 'cloudinary') {
        return await this.uploadToCloudinary(file, options);
      } else {
        return await this.storeLocally(file, options);
      }
    } catch (error) {
      console.error(`❌ Hybrid upload failed:`, error);
      throw error;
    }
  }

  // Upload to Cloudinary (existing logic) - NO FALLBACK
  async uploadToCloudinary(file, options = {}) {
    console.log('☁️ Uploading to Cloudinary:', file.name);
    
    const result = await CloudinaryService.uploadMedia(file, options);
    
    return {
      ...result,
      storageType: 'cloudinary',
      localPath: null
    };
  }

  // Store file locally (new logic for videos and large images)
  async storeLocally(file, options = {}) {
    console.log('💾 Storing locally:', file.name);

    // Generate local file path
    const projectId = options.projectId || 'general';
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(file.name);
    const mediaType = this.videoTypes.includes(file.name.split('.').pop().toLowerCase()) ? 'videos' : 'images';
    const relativePath = `/${mediaType}/${projectId}/${timestamp}-${sanitizedFileName}`;
    
    try {
      // Save file to local file manager
      const savedFile = await LocalFileManager.saveFile(file, relativePath);
      
      // Create result object
      const localResult = {
        publicId: `local_${timestamp}`,
        url: relativePath,
        localPath: relativePath,
        width: null, // Would be extracted for images
        height: null,
        format: file.name.split('.').pop().toLowerCase(),
        bytes: file.size,
        duration: null, // Would be extracted for videos
        resourceType: this.videoTypes.includes(file.name.split('.').pop().toLowerCase()) ? 'video' : 'image',
        storageType: 'local',
        uploadedAt: savedFile.uploadedAt,
        
        // Use appropriate URL for immediate preview
        preview: savedFile.temporaryPreview || savedFile.dataUrl,
        file: file, // Keep reference to original file
        needsServerUpload: false // Already "saved" locally
      };

      console.log('✅ Local storage completed:', {
        fileName: file.name,
        localPath: relativePath,
        size: this.formatFileSize(file.size)
      });

      return localResult;
    } catch (error) {
      console.error('❌ Local storage failed:', error);
      throw new Error(`Local storage failed: ${error.message}`);
    }
  }

  // Generate project-specific file paths
  generateLocalPath(projectId, fileName, mediaType = 'video') {
    const sanitizedProjectId = projectId.toString().toLowerCase().replace(/[^a-z0-9]/g, '-');
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const timestamp = Date.now();
    
    if (mediaType === 'video') {
      return `/videos/${sanitizedProjectId}/${timestamp}-${sanitizedFileName}`;
    } else {
      return `/images/${sanitizedProjectId}/${timestamp}-${sanitizedFileName}`;
    }
  }

  // Sanitize file names for safe storage
  sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check if file should be stored locally
  shouldStoreLocally(file) {
    return this.getStorageMethod(file).method === 'local';
  }

  // Check if file should go to Cloudinary
  shouldUploadToCloudinary(file) {
    return this.getStorageMethod(file).method === 'cloudinary';
  }

  // Get appropriate URL for display (handles both local and Cloudinary)
  getDisplayUrl(mediaItem) {
    if (mediaItem.storageType === 'local') {
      // For local files, prefer the local path over blob URLs to avoid lifecycle issues
      // Only create blob URLs for immediate preview during upload
      if (mediaItem.uploading) {
        try {
          // During upload, create fresh blob URL for immediate preview
          const fileUrl = LocalFileManager.getFileUrl(mediaItem.localPath);
          return fileUrl || mediaItem.preview || mediaItem.localPath;
        } catch (error) {
          console.error('Failed to get display URL for uploading local file:', error);
          return mediaItem.preview || mediaItem.localPath;
        }
      } else {
        // After successful upload, use the local path directly - no blob URLs
        console.log('📁 Using local path for display (no blob URL):', mediaItem.localPath);
        return mediaItem.localPath || mediaItem.preview;
      }
    } else {
      return mediaItem.url;
    }
  }

  // Clean up blob URLs for a project (garbage collection)
  cleanupProjectBlobs(projectId) {
    try {
      // Get all project files and clean up their blob URLs
      const projectFiles = LocalFileManager.getProjectFiles(projectId);
      let cleanedCount = 0;
      
      projectFiles.forEach(fileData => {
        if (fileData.path) {
          LocalFileManager.revokeBlobUrl(fileData.path);
          cleanedCount++;
        }
      });
      
      console.log(`🧹 Cleaned up ${cleanedCount} blob URLs for project ${projectId}`);
      return cleanedCount;
    } catch (error) {
      console.error('Failed to cleanup project blobs:', error);
      return 0;
    }
  }

  // Batch upload multiple files
  async uploadMultipleFiles(files, options = {}) {
    const uploadPromises = files.map(file => this.uploadMedia(file, {
      ...options,
      projectId: options.projectId || 'batch-upload'
    }));

    const results = await Promise.allSettled(uploadPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);
    
    console.log(`📊 Hybrid batch upload: ${successful.length} successful, ${failed.length} failed`);
    
    return { successful, failed };
  }
}

export default new HybridMediaService();