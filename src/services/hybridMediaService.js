// Hybrid Media Storage Service
// Routes images to Cloudinary and videos to local storage based on file type and size

import CloudinaryService from './cloudinaryConfig';
import LocalFileManager from './localFileManager';
import PortfolioRepositoryService from './portfolioRepositoryService';

class HybridMediaService {
  constructor() {
    // File type mappings
    this.imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    this.videoTypes = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v'];
    this.documentTypes = ['pdf', 'doc', 'docx', 'txt'];
    
    // Size thresholds
    this.imageCloudinaryMaxSize = 10 * 1024 * 1024; // 10MB - large images go local
    this.videoCloudinaryThreshold = 25 * 1024 * 1024; // 25MB - videos >= 25MB go to Cloudinary
    this.videoCloudinaryMaxSize = 100 * 1024 * 1024; // 100MB max for Cloudinary videos
    this.videoLocalMaxSize = 25 * 1024 * 1024; // 25MB max for GitHub videos
  }

  // Determine storage method based on file type and size
  getStorageMethod(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const fileSize = file.size;

    console.log(`🔍 DEBUG getStorageMethod:`, {
      fileName: file.name,
      extension: extension,
      fileSize: fileSize,
      fileSizeMB: (fileSize / 1024 / 1024).toFixed(2) + 'MB',
      isVideoType: this.videoTypes.includes(extension),
      videoCloudinaryThreshold: this.videoCloudinaryThreshold,
      videoCloudinaryMaxSize: this.videoCloudinaryMaxSize,
      thresholdMB: (this.videoCloudinaryThreshold / 1024 / 1024).toFixed(2) + 'MB',
      maxSizeMB: (this.videoCloudinaryMaxSize / 1024 / 1024).toFixed(2) + 'MB'
    });

    // Video files - check size thresholds
    if (this.videoTypes.includes(extension)) {
      console.log(`🎬 Video detected - checking size thresholds:`, {
        fileSize: fileSize,
        fileSizeMB: (fileSize / 1024 / 1024).toFixed(2) + 'MB',
        videoCloudinaryMaxSize: this.videoCloudinaryMaxSize,
        videoCloudinaryThreshold: this.videoCloudinaryThreshold,
        exceedsMaxSize: fileSize > this.videoCloudinaryMaxSize,
        meetsCloudinaryThreshold: fileSize >= this.videoCloudinaryThreshold
      });

      if (fileSize > this.videoCloudinaryMaxSize) {
        console.log(`❌ Video too large for any upload method`);
        return {
          method: 'error',
          type: 'video',
          reason: `Video file too large (${this.formatFileSize(fileSize)}). Maximum supported size is ${this.formatFileSize(this.videoCloudinaryMaxSize)}. Please compress your video.`
        };
      }
      
      if (fileSize >= this.videoCloudinaryThreshold) {
        console.log(`☁️ Video meets Cloudinary threshold - routing to Cloudinary`);
        return {
          method: 'cloudinary',
          type: 'video',
          reason: `Large video (${this.formatFileSize(fileSize)}) stored on Cloudinary for better performance`
        };
      }
      
      console.log(`📁 Video below threshold - routing to GitHub repository`);
      return {
        method: 'local',
        type: 'video',
        reason: `Small video (${this.formatFileSize(fileSize)}) stored in portfolio repository for offline iPad capability`
      };
    }

    // Document files (PDFs etc.) go to portfolio repository for iPad access
    if (this.documentTypes.includes(extension)) {
      return {
        method: 'local',
        type: 'document',
        reason: 'Document files stored in portfolio repository for iPad access'
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
    // CRITICAL: Gallery images MUST always go to Cloudinary for portfolio display
    if (options.type === 'gallery-image') {
      console.log(`🖼️ GALLERY IMAGE DETECTED - forcing Cloudinary upload:`, {
        fileName: file.name,
        size: this.formatFileSize(file.size),
        storageMethod: 'cloudinary (forced for gallery)',
        reason: 'Gallery images must be on Cloudinary for portfolio display',
        optionsReceived: options
      });
      
      try {
        const result = await this.uploadToCloudinary(file, options);
        console.log(`✅ Gallery image Cloudinary result:`, {
          fileName: file.name,
          url: result.url,
          storageType: result.storageType,
          publicId: result.publicId
        });
        return result;
      } catch (error) {
        console.error(`❌ CRITICAL: Gallery Cloudinary upload failed:`, {
          fileName: file.name,
          error: error.message,
          stack: error.stack
        });
        throw error; // Don't fallback for gallery images
      }
    }
    
    const storageDecision = this.getStorageMethod(file);
    
    console.log(`📁 HYBRID UPLOAD DECISION:`, {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: storageDecision.type,
      storageMethod: storageDecision.method.toUpperCase(),
      destination: storageDecision.method === 'cloudinary' ? 'Cloudinary CDN' : 'GitHub Repository',
      reason: storageDecision.reason
    });

    try {
      if (storageDecision.method === 'error') {
        console.error('❌ File upload blocked:', storageDecision.reason);
        throw new Error(storageDecision.reason);
      } else if (storageDecision.method === 'cloudinary') {
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
    const isVideo = this.videoTypes.includes(file.name.split('.').pop().toLowerCase());
    const fileType = isVideo ? 'video' : 'image';
    
    console.log(`☁️ Uploading ${fileType} to Cloudinary:`, {
      fileName: file.name,
      fileSize: this.formatFileSize(file.size),
      fileType: fileType,
      reason: 'Large file or image optimization via Cloudinary CDN'
    });
    
    // Add folder structure for portfolio videos
    const cloudinaryOptions = {
      ...options,
      folder: isVideo ? 'portfolio/videos' : options.folder || 'portfolio',
      tags: ['portfolio', fileType, ...(options.tags || [])]
    };
    
    try {
      const result = await CloudinaryService.uploadMedia(file, cloudinaryOptions);
      
      console.log(`✅ ${fileType} uploaded to Cloudinary successfully:`, {
        fileName: file.name,
        publicId: result.publicId,
        url: result.url,
        duration: result.duration || 'N/A',
        fileSize: this.formatFileSize(result.bytes || file.size)
      });
      
      return {
        ...result,
        storageType: 'cloudinary',
        localPath: null,
        // Add video-specific properties for consistency
        preview: result.url,
        needsServerUpload: false,
        uploadedAt: new Date().toISOString()
      };
    } catch (cloudinaryError) {
      // Enhanced error handling with fallback for videos only
      if (isVideo && file.size < this.videoLocalMaxSize) {
        console.warn(`⚠️ Cloudinary upload failed for video, trying GitHub fallback:`, cloudinaryError.message);
        console.log('🔄 Attempting GitHub repository upload as fallback...');
        
        try {
          return await this.storeLocally(file, options);
        } catch (fallbackError) {
          console.error('❌ Both Cloudinary and GitHub upload failed:', fallbackError.message);
          throw new Error(`Upload failed: Cloudinary (${cloudinaryError.message}) and GitHub fallback (${fallbackError.message}). File may be too large.`);
        }
      } else {
        // For images or videos too large for GitHub, don't fallback
        console.error('❌ Cloudinary upload failed with no fallback available:', cloudinaryError.message);
        throw new Error(`Cloudinary upload failed: ${cloudinaryError.message}`);
      }
    }
  }

  // Store file locally (new logic for videos and large images)
  async storeLocally(file, options = {}) {
    console.log('💾 Storing to portfolio repository:', file.name);

    const projectId = options.projectId || 'general';
    const extension = file.name.split('.').pop().toLowerCase();
    const isVideo = this.videoTypes.includes(extension);
    const isDocument = this.documentTypes.includes(extension);
    
    try {
      let repositoryResult;
      
      if (isVideo || isDocument) {
        // Store videos and documents in the portfolio repository for iPad access
        const fileType = isVideo ? 'video' : 'document';
        const fileSize = this.formatFileSize(file.size);
        const uploadMethod = file.size > 25 * 1024 * 1024 ? 'Git LFS' : 'GitHub API';
        
        console.log(`📄 Writing ${fileType} to portfolio repository...`);
        console.log(`📦 File size: ${fileSize} - Upload method: ${uploadMethod}`);
        
        if (isVideo) {
          repositoryResult = await PortfolioRepositoryService.writeVideoToRepository(file, projectId, file.name);
        } else {
          repositoryResult = await PortfolioRepositoryService.writeDocumentToRepository(file, projectId, file.name);
        }
        
        console.log(`✅ ${fileType} upload completed via ${repositoryResult.uploadMethod || uploadMethod}`);
        
        // Also store in local manager for immediate CMS preview
        await LocalFileManager.saveFile(file, repositoryResult.localPath);
        
        // Trigger portfolio deployment
        await PortfolioRepositoryService.triggerPortfolioDeployment(
          repositoryResult.commitSha,
          `Add ${fileType}: ${file.name} for project ${projectId}`
        );
        
      } else {
        // For large images, still use browser storage for now
        console.log('🖼️ Storing large image in browser storage...');
        const timestamp = Date.now();
        const sanitizedFileName = this.sanitizeFileName(file.name);
        const relativePath = `/images/${projectId}/${timestamp}-${sanitizedFileName}`;
        
        const savedFile = await LocalFileManager.saveFile(file, relativePath);
        repositoryResult = {
          localPath: relativePath,
          fileName: savedFile.name,
          size: file.size,
          type: file.type
        };
      }
      
      // Create result object
      const localResult = {
        publicId: `portfolio_${Date.now()}`,
        url: repositoryResult.localPath,
        localPath: repositoryResult.localPath,
        width: null, // Would be extracted for images
        height: null,
        format: file.name.split('.').pop().toLowerCase(),
        bytes: file.size,
        duration: null, // Would be extracted for videos
        resourceType: isVideo ? 'video' : isDocument ? 'raw' : 'image',
        storageType: 'portfolio', // New storage type for portfolio repository
        uploadedAt: new Date().toISOString(),
        
        // Use local path for preview (no blob URLs after successful upload)
        preview: repositoryResult.localPath,
        file: file,
        needsServerUpload: false,
        repositoryPath: repositoryResult.absolutePath
      };

      console.log('✅ Portfolio repository storage completed:', {
        fileName: file.name,
        localPath: repositoryResult.localPath,
        size: this.formatFileSize(file.size),
        storageType: 'portfolio'
      });

      return localResult;
    } catch (error) {
      console.error('❌ Portfolio repository storage failed:', error);
      // Fallback to browser storage if repository storage fails
      console.log('⚠️ Falling back to browser storage...');
      return await this.storeInBrowser(file, options);
    }
  }

  // Fallback: Store in browser (old method)
  async storeInBrowser(file, options = {}) {
    console.log('💾 Storing in browser (fallback):', file.name);

    const projectId = options.projectId || 'general';
    const timestamp = Date.now();
    const sanitizedFileName = this.sanitizeFileName(file.name);
    const mediaType = this.videoTypes.includes(file.name.split('.').pop().toLowerCase()) ? 'videos' : 'images';
    const relativePath = `/${mediaType}/${projectId}/${timestamp}-${sanitizedFileName}`;
    
    try {
      const savedFile = await LocalFileManager.saveFile(file, relativePath);
      
      const localResult = {
        publicId: `local_${timestamp}`,
        url: relativePath,
        localPath: relativePath,
        width: null,
        height: null,
        format: file.name.split('.').pop().toLowerCase(),
        bytes: file.size,
        duration: null,
        resourceType: this.videoTypes.includes(file.name.split('.').pop().toLowerCase()) ? 'video' : 'image',
        storageType: 'local',
        uploadedAt: savedFile.uploadedAt,
        preview: savedFile.temporaryPreview || savedFile.dataUrl,
        file: file,
        needsServerUpload: false
      };

      return localResult;
    } catch (error) {
      console.error('❌ Browser storage failed:', error);
      throw new Error(`Browser storage failed: ${error.message}`);
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

  // Get appropriate URL for display (handles Cloudinary, local, and portfolio storage)
  getDisplayUrl(mediaItem) {
    if (mediaItem.storageType === 'portfolio') {
      // For portfolio repository files, use the local path directly
      console.log('📁 Using portfolio repository path for display:', mediaItem.localPath);
      return mediaItem.localPath || mediaItem.preview;
      
    } else if (mediaItem.storageType === 'local') {
      // For browser-stored files, prefer the local path over blob URLs to avoid lifecycle issues
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
      // For Cloudinary files
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