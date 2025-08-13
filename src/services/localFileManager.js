// Local File Manager for Static App Simulation
// Handles local file storage simulation for development/demo purposes

class LocalFileManager {
  constructor() {
    this.localFiles = new Map(); // In-memory storage for demo
    this.loadFromStorage();
  }

  // Save file reference to localStorage (simulated local storage)
  saveFile(file, localPath) {
    const fileData = {
      name: file.name,
      size: file.size,
      type: file.type,
      localPath: localPath,
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString(),
      // Store file as base64 for demo purposes
      dataUrl: null // Will be set when needed
    };

    // Convert file to base64 for storage (demo only - real app would upload to server)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        fileData.dataUrl = reader.result;
        this.localFiles.set(localPath, fileData);
        this.saveToStorage();
        
        console.log('📁 File saved locally:', {
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

  // Get file URL for display (returns data URL for demo)
  getFileUrl(localPath) {
    const file = this.getFile(localPath);
    return file ? file.dataUrl : null;
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

  // Persist to localStorage (demo storage)
  saveToStorage() {
    try {
      const serialized = JSON.stringify([...this.localFiles.entries()]);
      localStorage.setItem('local-files', serialized);
    } catch (error) {
      console.warn('Failed to save local files to storage:', error);
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