import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, File, AlertCircle, CheckCircle, BarChart3 } from 'lucide-react';
import CloudinaryService from '../services/cloudinaryConfig';
import './MediaUploader.css';

const MediaUploader = ({ onUploadComplete, onUploadProgress, maxFiles = 10, acceptedTypes = "image/*,video/*" }) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [usageStats, setUsageStats] = useState(CloudinaryService.getUsageStats());
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 100 * 1024 * 1024; // 100MB limit
      
      return (isImage || isVideo) && isValidSize;
    });

    if (validFiles.length !== fileArray.length) {
      alert(`${fileArray.length - validFiles.length} files were rejected. Only images and videos under 100MB are allowed.`);
    }

    if (validFiles.length + uploadQueue.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed. ${validFiles.length + uploadQueue.length - maxFiles} files will be ignored.`);
      validFiles.splice(maxFiles - uploadQueue.length);
    }

    // Add files to upload queue
    const queueItems = validFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending', // pending, uploading, completed, failed
      progress: 0,
      preview: null,
      result: null,
      error: null
    }));

    // Generate previews
    queueItems.forEach(item => {
      if (item.file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, preview: e.target.result } : q
          ));
        };
        reader.readAsDataURL(item.file);
      } else if (item.file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(item.file);
        video.currentTime = 1; // Get frame at 1 second
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0);
          const preview = canvas.toDataURL();
          
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, preview } : q
          ));
          
          URL.revokeObjectURL(video.src);
        };
      }
    });

    setUploadQueue(prev => [...prev, ...queueItems]);
  }, [uploadQueue.length, maxFiles]);

  // Upload all files in queue
  const uploadAll = useCallback(async () => {
    const pendingItems = uploadQueue.filter(item => item.status === 'pending');
    if (pendingItems.length === 0) return;

    setUploading(true);

    for (const item of pendingItems) {
      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { ...q, status: 'uploading', progress: 0 } : q
        ));

        // Determine folder based on file type
        const folder = item.file.type.startsWith('video/') ? 'portfolio/videos' : 'portfolio/images';
        
        // Upload to Cloudinary
        const result = await CloudinaryService.uploadMedia(item.file, {
          folder,
          tags: ['portfolio', 'cms-upload', item.file.type.startsWith('video/') ? 'video' : 'image']
        });

        // Update success status
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { 
            ...q, 
            status: 'completed', 
            progress: 100,
            result 
          } : q
        ));

        // Update usage stats
        setUsageStats(CloudinaryService.getUsageStats());

        // Notify parent component
        if (onUploadComplete) {
          onUploadComplete(result, item);
        }

      } catch (error) {
        console.error('Upload failed:', error);
        
        // Update error status
        setUploadQueue(prev => prev.map(q => 
          q.id === item.id ? { 
            ...q, 
            status: 'failed', 
            error: error.message 
          } : q
        ));
      }
    }

    setUploading(false);
  }, [uploadQueue, onUploadComplete]);

  // Remove item from queue
  const removeItem = useCallback((id) => {
    setUploadQueue(prev => prev.filter(q => q.id !== id));
  }, []);

  // Clear completed items
  const clearCompleted = useCallback(() => {
    setUploadQueue(prev => prev.filter(q => q.status !== 'completed'));
  }, []);

  // Retry failed upload
  const retryItem = useCallback((id) => {
    setUploadQueue(prev => prev.map(q => 
      q.id === id ? { ...q, status: 'pending', error: null } : q
    ));
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  // File input change handler
  const handleFileInputChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  // Get file type icon
  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image size={20} />;
    if (type.startsWith('video/')) return <Video size={20} />;
    return <File size={20} />;
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="media-uploader">
      {/* Usage Stats */}
      <div className="usage-stats">
        <div className="usage-item">
          <BarChart3 size={16} />
          <span>Bandwidth: {formatFileSize(usageStats.monthly.used)} / {formatFileSize(usageStats.monthly.limit)}</span>
          <div className="usage-bar">
            <div 
              className="usage-progress" 
              style={{ width: `${Math.min(usageStats.monthly.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        <Upload size={48} className="upload-icon" />
        <h3>Drop files here or click to upload</h3>
        <p>Support for images and videos up to 100MB</p>
        <p>Maximum {maxFiles} files</p>
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <div className="queue-header">
            <h4>Upload Queue ({uploadQueue.length} files)</h4>
            <div className="queue-actions">
              <button 
                onClick={clearCompleted}
                disabled={!uploadQueue.some(q => q.status === 'completed')}
                className="btn-secondary"
              >
                Clear Completed
              </button>
              <button 
                onClick={uploadAll}
                disabled={uploading || !uploadQueue.some(q => q.status === 'pending')}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>
          </div>

          <div className="queue-items">
            {uploadQueue.map(item => (
              <div key={item.id} className={`queue-item ${item.status}`}>
                <div className="item-preview">
                  {item.preview ? (
                    item.type.startsWith('video/') ? (
                      <img src={item.preview} alt="Video thumbnail" />
                    ) : (
                      <img src={item.preview} alt="Preview" />
                    )
                  ) : (
                    <div className="preview-placeholder">
                      {getFileIcon(item.type)}
                    </div>
                  )}
                </div>

                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-details">
                    {formatFileSize(item.size)} • {item.type}
                  </div>
                  
                  {item.status === 'uploading' && (
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  
                  {item.error && (
                    <div className="error-message">{item.error}</div>
                  )}

                  {item.result && (
                    <div className="upload-result">
                      <span className="result-url">{item.result.url}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(item.result.url)}
                        className="copy-btn"
                      >
                        Copy URL
                      </button>
                    </div>
                  )}
                </div>

                <div className="item-actions">
                  {getStatusIcon(item.status)}
                  
                  {item.status === 'failed' && (
                    <button 
                      onClick={() => retryItem(item.id)}
                      className="retry-btn"
                      title="Retry upload"
                    >
                      ↻
                    </button>
                  )}
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="remove-btn"
                    title="Remove from queue"
                    disabled={item.status === 'uploading'}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;