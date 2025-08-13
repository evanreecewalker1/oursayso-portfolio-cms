// Local File Manager for Static App Simulation
// Handles local file storage simulation for development/demo purposes

class LocalFileManager {
  constructor() {
    this.localFiles = new Map(); // In-memory storage for demo
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
      // For large files, we'll use blob URLs instead of base64
      blobUrl: null,
      fileReference: null // Keep reference to original file object
    };

    // For large files (>5MB), use blob URL instead of base64 to avoid localStorage limits
    if (file.size > 5 * 1024 * 1024) {
      console.log('📁 Large file detected - using blob URL storage:', this.formatFileSize(file.size));
      
      // Create persistent blob URL
      fileData.blobUrl = URL.createObjectURL(file);
      fileData.fileReference = file; // Keep file reference in memory
      fileData.storageMethod = 'blob';
      
      // Save only metadata to localStorage (not file data)
      this.localFiles.set(localPath, {
        ...fileData,
        fileReference: null // Don't try to serialize file object
      });
      
      // Store file reference separately in memory
      this.fileReferences = this.fileReferences || new Map();
      this.fileReferences.set(localPath, file);
      
      console.log('📁 Large file stored with blob URL:', {
        path: localPath,
        size: this.formatFileSize(file.size),
        type: file.type,
        blobUrl: fileData.blobUrl
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

  // Delete file
  deleteFile(localPath) {
    const existed = this.localFiles.delete(localPath);
    if (existed) {
      this.saveToStorage();
      console.log('🗑️ File deleted:', localPath);
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

  // Get file URL for display (handles both blob and base64)
  getFileUrl(localPath) {
    const file = this.getFile(localPath);
    if (!file) return null;
    
    if (file.storageMethod === 'blob') {
      // For large files, return blob URL or recreate if needed
      if (file.blobUrl) {
        return file.blobUrl;
      } else if (this.fileReferences && this.fileReferences.has(localPath)) {
        // Recreate blob URL if lost
        const fileRef = this.fileReferences.get(localPath);
        const newBlobUrl = URL.createObjectURL(fileRef);
        file.blobUrl = newBlobUrl;
        return newBlobUrl;
      }
      return null;
    } else {
      // For small files, return base64 data URL
      return file.dataUrl;
    }
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

  // Clear all files
  clearAll() {
    const count = this.localFiles.size;
    this.localFiles.clear();
    this.saveToStorage();
    console.log(`🗑️ Cleared all ${count} local files`);
    return count;
  }
}

export default new LocalFileManager();