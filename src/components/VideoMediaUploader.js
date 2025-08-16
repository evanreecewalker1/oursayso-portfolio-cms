import React, { useState, useRef, useCallback } from 'react';
import { Upload, Video, AlertCircle, CheckCircle, X, Pause, Play, Volume2, VolumeX, FileImage, Camera } from 'lucide-react';
import HybridMediaService from '../services/hybridMediaService';
import './VideoMediaUploader.css';

const VideoMediaUploader = ({ 
  onUploadComplete, 
  onUploadProgress, 
  initialFiles = [],
  projectId,
  maxSize = 500 * 1024 * 1024, // 500MB default
  acceptedFormats = ['mp4', 'mov', 'webm', 'avi', 'm4v'],
  allowMultiple = false,
  onCustomPreviewUpload // New prop for custom preview functionality
}) => {
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewVideo, setPreviewVideo] = useState(null);
  const [videoStates, setVideoStates] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalSizeUploaded, setTotalSizeUploaded] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState(null);
  const [customPreviews, setCustomPreviews] = useState({}); // Store custom preview images for each video
  const [uploadingPreviews, setUploadingPreviews] = useState({}); // Track preview upload status
  const fileInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const customPreviewRefs = useRef({}); // Refs for custom preview file inputs

  // Enhanced file validation for videos
  const validateVideoFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const errors = [];

    // Check file type
    if (!acceptedFormats.includes(extension)) {
      errors.push(`Invalid format. Accepted: ${acceptedFormats.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      errors.push(`File too large. Maximum: ${maxMB}MB`);
    }

    // Check if it's actually a video
    if (!file.type.startsWith('video/')) {
      errors.push('File is not a valid video');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Enhanced file handling with metadata extraction
  const handleFiles = useCallback(async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    const invalidFiles = [];

    for (const file of fileArray) {
      const validation = validateVideoFile(file);
      if (validation.isValid) {
        // Extract basic metadata
        const metadata = await extractVideoMetadata(file);
        validFiles.push({
          file,
          metadata,
          id: `video_${Date.now()}_${Math.random()}`
        });
      } else {
        invalidFiles.push({
          file,
          errors: validation.errors
        });
      }
    }

    // Show validation errors
    if (invalidFiles.length > 0) {
      const errorMessage = invalidFiles.map(item => 
        `${item.file.name}: ${item.errors.join(', ')}`
      ).join('\n');
      alert(`${invalidFiles.length} file(s) rejected:\n\n${errorMessage}`);
    }

    // Limit files if multiple not allowed
    if (!allowMultiple && validFiles.length > 1) {
      validFiles.splice(1);
      alert('Only one video file allowed at a time.');
    }

    // Add to upload queue
    if (validFiles.length > 0) {
      const queueItems = validFiles.map(({ file, metadata, id }) => ({
        id,
        file,
        metadata,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'pending', // pending, uploading, completed, failed
        progress: 0,
        preview: null,
        result: null,
        error: null,
        uploadStartTime: null,
        estimatedTimeRemaining: null
      }));

      // Generate video previews
      for (const item of queueItems) {
        try {
          const preview = await generateVideoPreview(item.file);
          item.preview = preview;
        } catch (error) {
          console.warn(`Failed to generate preview for ${item.name}:`, error);
        }
      }

      setUploadQueue(prev => [...prev, ...queueItems]);
    }
  }, [maxSize, acceptedFormats, allowMultiple]);

  // Extract video metadata
  const extractVideoMetadata = async (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          aspectRatio: video.videoWidth / video.videoHeight
        });
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        resolve({
          duration: null,
          width: null,
          height: null,
          aspectRatio: null
        });
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Generate video preview thumbnail
  const generateVideoPreview = async (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Seek to 1 second or 10% of duration, whichever is shorter
        const seekTime = Math.min(1, video.duration * 0.1);
        video.currentTime = seekTime;
      };

      video.onseeked = () => {
        try {
          ctx.drawImage(video, 0, 0);
          const previewUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(previewUrl);
        } catch (error) {
          reject(error);
        }
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video for preview'));
        URL.revokeObjectURL(video.src);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // Enhanced upload with progress tracking
  const startUpload = async () => {
    if (uploadQueue.length === 0 || uploading) return;

    setUploading(true);
    setUploadStartTime(Date.now());
    setOverallProgress(0);
    setTotalSizeUploaded(0);
    const results = [];
    const totalSize = uploadQueue.reduce((sum, item) => sum + item.size, 0);

    for (const item of uploadQueue) {
      if (item.status !== 'pending') continue;

      try {
        // Update item status
        setUploadQueue(prev => prev.map(qi => 
          qi.id === item.id 
            ? { ...qi, status: 'uploading', uploadStartTime: Date.now() }
            : qi
        ));

        // Upload with progress tracking
        const result = await HybridMediaService.uploadMedia(item.file, {
          projectId,
          mediaItemType: 'video',
          onProgress: (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [item.id]: progress
            }));

            // Calculate ETA and overall progress
            const elapsed = Date.now() - item.uploadStartTime;
            const estimatedTotal = elapsed / (progress / 100);
            const estimatedRemaining = estimatedTotal - elapsed;
            
            // Update individual item progress
            setUploadQueue(prev => prev.map(qi => 
              qi.id === item.id 
                ? { 
                    ...qi, 
                    progress,
                    estimatedTimeRemaining: estimatedRemaining
                  }
                : qi
            ));
            
            // Calculate overall progress
            const currentFileContribution = (item.size / totalSize) * (progress / 100);
            setTotalSizeUploaded(prev => {
              const newTotal = prev + currentFileContribution;
              setOverallProgress((newTotal / totalSize) * 100);
              return newTotal;
            });

            // Report progress to parent
            onUploadProgress?.({
              fileId: item.id,
              fileName: item.name,
              progress,
              estimatedTimeRemaining
            });
          }
        });

        // Enhanced result with metadata and custom preview
        const enhancedResult = {
          ...result,
          originalMetadata: item.metadata,
          uploadedAt: new Date().toISOString(),
          fileName: item.file.name,
          originalSize: item.file.size,
          customPreview: customPreviews[item.id] || null // Include custom preview if available
        };

        results.push(enhancedResult);

        // Update queue with success
        setUploadQueue(prev => prev.map(qi => 
          qi.id === item.id 
            ? { 
                ...qi, 
                status: 'completed',
                result: enhancedResult,
                progress: 100
              }
            : qi
        ));

      } catch (error) {
        console.error(`Upload failed for ${item.name}:`, error);
        
        // Update queue with error
        setUploadQueue(prev => prev.map(qi => 
          qi.id === item.id 
            ? { 
                ...qi, 
                status: 'failed',
                error: error.message,
                progress: 0
              }
            : qi
        ));
      }
    }

    setUploading(false);
    
    // Final progress update
    setOverallProgress(100);
    
    // Report completion to parent with summary
    if (results.length > 0) {
      const uploadSummary = {
        results,
        totalFiles: results.length,
        totalSize: results.reduce((sum, r) => sum + r.originalSize, 0),
        uploadTime: Date.now() - uploadStartTime,
        successCount: results.length,
        failedCount: uploadQueue.filter(q => q.status === 'failed').length
      };
      onUploadComplete?.(uploadSummary);
    }
    
    // Reset progress tracking
    setTimeout(() => {
      setOverallProgress(0);
      setTotalSizeUploaded(0);
      setUploadStartTime(null);
    }, 2000);
  };

  // Remove item from queue
  const removeFromQueue = (itemId) => {
    setUploadQueue(prev => prev.filter(item => item.id !== itemId));
    setUploadProgress(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Clear completed/failed items
  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(item => 
      item.status === 'pending' || item.status === 'uploading'
    ));
  };

  // Retry failed upload
  const retryUpload = (itemId) => {
    setUploadQueue(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, status: 'pending', error: null, progress: 0 }
        : item
    ));
    setUploadProgress(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format duration for display
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Video preview controls
  const toggleVideoPreview = (videoSrc) => {
    if (previewVideo === videoSrc) {
      setPreviewVideo(null);
    } else {
      setPreviewVideo(videoSrc);
    }
  };

  const toggleVideoPlayback = (videoId) => {
    const video = document.getElementById(videoId);
    if (video) {
      if (video.paused) {
        video.play();
        setVideoStates(prev => ({ ...prev, [videoId]: { ...prev[videoId], playing: true } }));
      } else {
        video.pause();
        setVideoStates(prev => ({ ...prev, [videoId]: { ...prev[videoId], playing: false } }));
      }
    }
  };

  const toggleVideoMute = (videoId) => {
    const video = document.getElementById(videoId);
    if (video) {
      video.muted = !video.muted;
      setVideoStates(prev => ({ 
        ...prev, 
        [videoId]: { ...prev[videoId], muted: video.muted } 
      }));
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

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time remaining
  const formatTimeRemaining = (milliseconds) => {
    if (!milliseconds) return '';
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s remaining`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
  };

  // Handle custom preview image upload
  const handleCustomPreviewUpload = async (videoId, file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file for the custom preview');
      return;
    }

    // Validate image file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Preview image must be smaller than 10MB');
      return;
    }

    try {
      setUploadingPreviews(prev => ({ ...prev, [videoId]: true }));

      // Upload the image using HybridMediaService
      const result = await HybridMediaService.uploadMedia(file, {
        projectId: `custom-preview-${videoId}`,
        mediaItemType: 'image',
        folder: 'portfolio/video-previews'
      });

      // Store the custom preview result
      setCustomPreviews(prev => ({
        ...prev,
        [videoId]: {
          url: result.url,
          publicId: result.publicId,
          name: file.name,
          uploadedAt: new Date().toISOString()
        }
      }));

      // Notify parent component if callback provided
      if (onCustomPreviewUpload) {
        onCustomPreviewUpload(videoId, result);
      }

      console.log(`✅ Custom preview uploaded for video ${videoId}:`, result);

    } catch (error) {
      console.error(`❌ Failed to upload custom preview for ${videoId}:`, error);
      alert(`Failed to upload custom preview: ${error.message}`);
    } finally {
      setUploadingPreviews(prev => ({ ...prev, [videoId]: false }));
    }
  };

  // Remove custom preview
  const removeCustomPreview = (videoId) => {
    setCustomPreviews(prev => {
      const { [videoId]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Trigger custom preview file picker
  const triggerCustomPreviewUpload = (videoId) => {
    if (!customPreviewRefs.current[videoId]) {
      customPreviewRefs.current[videoId] = document.createElement('input');
      customPreviewRefs.current[videoId].type = 'file';
      customPreviewRefs.current[videoId].accept = 'image/*';
      customPreviewRefs.current[videoId].onchange = (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCustomPreviewUpload(videoId, e.target.files[0]);
        }
      };
    }
    customPreviewRefs.current[videoId].click();
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // File input change handler
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="video-media-uploader">
      {/* Upload Zone */}
      {uploadQueue.length === 0 ? (
        <div 
          className="video-upload-zone no-drag-drop"
          onClick={() => fileInputRef.current?.click()}
        >
          <Video size={48} />
          <h3>Upload Video Files</h3>
          <p>Click to select video files</p>
          <div className="upload-specs">
            <span>Accepted: {acceptedFormats.join(', ').toUpperCase()}</span>
            <span>Max size: {Math.round(maxSize / (1024 * 1024))}MB</span>
            {!allowMultiple && <span>Single file only</span>}
          </div>
          <button className="upload-btn">
            <Upload size={20} />
            Choose Video{allowMultiple ? 's' : ''}
          </button>
        </div>
      ) : (
        <div className="video-upload-queue">
          <div className="queue-header">
            <h4>Video Upload Queue ({uploadQueue.length})</h4>
            <div className="queue-actions">
              {!uploading && uploadQueue.some(item => item.status === 'pending') && (
                <button className="btn-upload" onClick={startUpload}>
                  Upload All
                </button>
              )}
              {uploadQueue.some(item => item.status === 'completed' || item.status === 'failed') && (
                <button className="btn-clear" onClick={clearCompleted}>
                  Clear Completed
                </button>
              )}
              <button 
                className="btn-add-more"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || (!allowMultiple && uploadQueue.length >= 1)}
              >
                <Upload size={16} />
                Add More
              </button>
            </div>
          </div>

          <div className="queue-items">
            {uploadQueue.map(item => (
              <div key={item.id} className={`queue-item ${item.status}`}>
                <div className="item-preview">
                  {customPreviews[item.id] ? (
                    <div className="video-thumbnail-container custom-preview">
                      <img 
                        src={customPreviews[item.id].url}
                        alt={`Custom preview of ${item.name}`}
                        className="video-thumbnail"
                        onClick={() => toggleVideoPreview(URL.createObjectURL(item.file))}
                      />
                      <div className="custom-preview-badge">
                        <Camera size={14} />
                      </div>
                      <div className="play-overlay">
                        <Play size={24} />
                      </div>
                    </div>
                  ) : item.preview ? (
                    <div className="video-thumbnail-container">
                      <img 
                        src={item.preview}
                        alt={`Preview of ${item.name}`}
                        className="video-thumbnail"
                        onClick={() => toggleVideoPreview(URL.createObjectURL(item.file))}
                      />
                      <div className="play-overlay">
                        <Play size={24} />
                      </div>
                    </div>
                  ) : (
                    <div className="video-placeholder">
                      <Video size={32} />
                    </div>
                  )}
                </div>

                <div className="item-info">
                  <div className="item-header">
                    <h5 className="item-name">{item.name}</h5>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromQueue(item.id)}
                      disabled={item.status === 'uploading'}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="item-details">
                    <span className="file-size">{formatFileSize(item.size)}</span>
                    {item.metadata.duration && (
                      <span className="duration">{formatDuration(item.metadata.duration)}</span>
                    )}
                    {item.metadata.width && item.metadata.height && (
                      <span className="dimensions">{item.metadata.width}×{item.metadata.height}</span>
                    )}
                  </div>

                  {/* Custom Preview Controls */}
                  <div className="custom-preview-controls">
                    {customPreviews[item.id] ? (
                      <div className="preview-status">
                        <Camera size={14} />
                        <span>Custom preview set</span>
                        <button 
                          className="btn-link btn-danger"
                          onClick={() => removeCustomPreview(item.id)}
                          title="Remove custom preview"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn-custom-preview"
                        onClick={() => triggerCustomPreviewUpload(item.id)}
                        disabled={item.status === 'uploading' || uploadingPreviews[item.id]}
                        title="Upload custom preview image"
                      >
                        {uploadingPreviews[item.id] ? (
                          <>
                            <div className="spinner-small"></div>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileImage size={14} />
                            Add Custom Preview
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="item-status">
                    {item.status === 'pending' && (
                      <div className="status-pending">
                        <AlertCircle size={16} />
                        Ready to upload
                      </div>
                    )}

                    {item.status === 'uploading' && (
                      <div className="status-uploading">
                        <div className="progress-info">
                          <span>{Math.round(item.progress || 0)}%</span>
                          {item.estimatedTimeRemaining && (
                            <span className="eta">{formatTimeRemaining(item.estimatedTimeRemaining)}</span>
                          )}
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${item.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {item.status === 'completed' && (
                      <div className="status-completed">
                        <CheckCircle size={16} />
                        Upload complete
                      </div>
                    )}

                    {item.status === 'failed' && (
                      <div className="status-failed">
                        <AlertCircle size={16} />
                        {item.error || 'Upload failed'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="video-preview-modal" onClick={() => setPreviewVideo(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h4>Video Preview</h4>
              <button 
                className="close-preview"
                onClick={() => setPreviewVideo(null)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="preview-video-container">
              <video
                ref={previewVideoRef}
                src={previewVideo}
                controls
                autoPlay
                className="preview-video"
                id="preview-video"
                onPlay={() => setVideoStates(prev => ({ 
                  ...prev, 
                  'preview-video': { ...prev['preview-video'], playing: true } 
                }))}
                onPause={() => setVideoStates(prev => ({ 
                  ...prev, 
                  'preview-video': { ...prev['preview-video'], playing: false } 
                }))}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={allowMultiple}
        accept="video/*"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default VideoMediaUploader;