// Local File Manager for Static App Simulation
// Handles local file storage simulation for development/demo purposes

class LocalFileManager {
  constructor() {
    this.localFiles = new Map(); // In-memory storage for demo
    this.fileReferences = new Map(); // In-memory file references
    this.blobUrls = new Map(); // Track blob URLs for cleanup
    this.loadFromStorage();
  }

  // Save file reference using efficient storage method
  saveFile(file, localPath) {
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      localPath: localPath,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
      storageMethod: null,
      temporaryPreview: null // For immediate preview only
    };

    // For large files (>5MB), store file reference and create temporary preview
    if (file.size > 5 * 1024 * 1024) {
      console.log('📁 Large file detected - using file reference storage:', this.formatFileSize(file.size));
      
      fileData.storageMethod = 'file-reference';
      
      // Store file reference for permanent access
      this.fileReferences.set(localPath, file);
      
      // Create temporary blob URL for immediate preview only
      const tempBlobUrl = URL.createObjectURL(file);
      fileData.temporaryPreview = tempBlobUrl;
      
      // Track blob URL for cleanup
      this.blobUrls.set(localPath, tempBlobUrl);
      
      // Save metadata to localStorage (no blob URL persisted)
      this.localFiles.set(localPath, {
        ...fileData,
        temporaryPreview: null // Don't persist blob URLs
      });
      
      console.log('📁 Large file stored with file reference:', {
        path: localPath,
        size: this.formatFileSize(file.size),
        type: file.type,
        hasPreview: !!tempBlobUrl
      });
      
      return Promise.resolve(fileData);
    } else {
      // For smaller files, convert to base64 as before
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          fileData.dataUrl = reader.result;
          fileData.storageMethod = 'base64';
          this.localFiles.set(localPath, fileData);
          this.saveToStorage();
          
          console.log('📁 Small file saved as base64:', {
            path: localPath,
            size: this.formatFileSize(file.size),
            type: file.type
          });
          
          resolve(fileData);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  }

  // Get file data by path
  getFile(localPath) {
    return this.localFiles.get(localPath);
  }

  // Check if file exists
  hasFile(localPath) {
    return this.localFiles.has(localPath);
  }

  // Delete file and clean up resources
  deleteFile(localPath) {
    // Clean up blob URL if exists
    this.revokeBlobUrl(localPath);
    
    // Remove file reference
    this.fileReferences.delete(localPath);
    
    // Remove from local files
    const existed = this.localFiles.delete(localPath);
    if (existed) {
      this.saveToStorage();
      console.log('🗑️ File deleted and cleaned up:', localPath);
    }
    return existed;
  }

  // Get all files for a project
  getProjectFiles(projectId) {
    const projectFiles = [];
    for (const [path, fileData] of this.localFiles.entries()) {
      if (path.includes(`/${projectId}/`)) {
        projectFiles.push({ path, ...fileData });
      }
    }
    return projectFiles;
  }

  // Get file URL for display (handles file references and base64)
  getFileUrl(localPath) {
    const file = this.getFile(localPath);
    if (!file) return null;
    
    if (file.storageMethod === 'file-reference') {
      // For large files, create fresh blob URL each time to avoid lifecycle issues
      if (this.fileReferences && this.fileReferences.has(localPath)) {
        try {
          const fileRef = this.fileReferences.get(localPath);
          const freshBlobUrl = URL.createObjectURL(fileRef);
          
          // Clean up any previous blob URL for this path
          this.revokeBlobUrl(localPath);
          
          // Track the new blob URL
          this.blobUrls.set(localPath, freshBlobUrl);
          
          console.log('📁 Created fresh blob URL for:', localPath);
          return freshBlobUrl;
        } catch (error) {
          console.error('❌ Failed to create blob URL:', error);
          return null;
        }
      }
      return null;
    } else if (file.storageMethod === 'base64') {
      // For small files, return base64 data URL
      return file.dataUrl;
    }
    
    return null;
  }

  // Clean up unused files (garbage collection)
  cleanupUnusedFiles(usedPaths) {
    let deleted = 0;
    for (const path of this.localFiles.keys()) {
      if (!usedPaths.includes(path)) {
        this.deleteFile(path);
        deleted++;
      }
    }
    console.log(`🧹 Cleaned up ${deleted} unused files`);
    return deleted;
  }

  // Persist to localStorage (demo storage) - only metadata, not file data
  saveToStorage() {
    try {
      // Only save small files' data to localStorage, large files are memory-only
      const entriesToSave = [];
      for (const [path, fileData] of this.localFiles.entries()) {
        if (fileData.storageMethod === 'base64') {
          // Save small files completely
          entriesToSave.push([path, fileData]);
        } else {
          // Save only metadata for large files
          entriesToSave.push([path, {
            ...fileData,
            blobUrl: null, // Don't persist blob URLs
            fileReference: null // Don't persist file references
          }]);
        }
      }
      
      const serialized = JSON.stringify(entriesToSave);
      localStorage.setItem('local-files', serialized);
      console.log(`💾 Saved ${entriesToSave.length} file entries to storage`);
    } catch (error) {
      console.warn('Failed to save local files to storage:', error);
      // If localStorage is full, clear it and try again with just metadata
      try {
        localStorage.removeItem('local-files');
        console.warn('Cleared localStorage due to quota exceeded');
      } catch (clearError) {
        console.error('Failed to clear localStorage:', clearError);
      }
    }
  }

  // Load from localStorage
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('local-files');
      if (stored) {
        const entries = JSON.parse(stored);
        this.localFiles = new Map(entries);
        console.log(`📂 Loaded ${this.localFiles.size} local files from storage`);
      }
    } catch (error) {
      console.warn('Failed to load local files from storage:', error);
      this.localFiles = new Map();
    }
  }

  // Get storage statistics
  getStorageStats() {
    let totalSize = 0;
    let fileCount = 0;
    const fileTypes = {};

    for (const fileData of this.localFiles.values()) {
      totalSize += fileData.size;
      fileCount++;
      
      const extension = fileData.name.split('.').pop()?.toLowerCase() || 'unknown';
      fileTypes[extension] = (fileTypes[extension] || 0) + 1;
    }

    return {
      totalFiles: fileCount,
      totalSize,
      fileTypes,
      formattedSize: this.formatFileSize(totalSize)
    };
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Export files data (for deployment)
  exportFilesData() {
    const exports = {};
    for (const [path, fileData] of this.localFiles.entries()) {
      exports[path] = {
        name: fileData.name,
        size: fileData.size,
        type: fileData.type,
        uploadedAt: fileData.uploadedAt,
        dataUrl: fileData.dataUrl
      };
    }
    return exports;
  }

  // Revoke blob URL for specific path
  revokeBlobUrl(localPath) {
    if (this.blobUrls.has(localPath)) {
      const blobUrl = this.blobUrls.get(localPath);
      try {
        URL.revokeObjectURL(blobUrl);
        this.blobUrls.delete(localPath);
        console.log('🧹 Revoked blob URL for:', localPath);
      } catch (error) {
        console.warn('⚠️ Failed to revoke blob URL:', error);
      }
    }
  }

  // Clean up all blob URLs
  revokeAllBlobUrls() {
    let revokedCount = 0;
    for (const [path, blobUrl] of this.blobUrls.entries()) {
      try {
        URL.revokeObjectURL(blobUrl);
        revokedCount++;
      } catch (error) {
        console.warn('⚠️ Failed to revoke blob URL for', path, ':', error);
      }
    }
    this.blobUrls.clear();
    console.log(`🧹 Revoked ${revokedCount} blob URLs`);
    return revokedCount;
  }

  // Clear all files and clean up resources
  clearAll() {
    const count = this.localFiles.size;
    
    // Clean up all blob URLs
    this.revokeAllBlobUrls();
    
    // Clear all data
    this.localFiles.clear();
    this.fileReferences.clear();
    this.saveToStorage();
    
    console.log(`🗑️ Cleared all ${count} local files and cleaned up resources`);
    return count;
  }
}

export default new LocalFileManager();