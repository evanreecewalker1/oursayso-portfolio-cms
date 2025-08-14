import React, { useState, useRef } from 'react';
import './MediaPreview.css';

const MediaPreview = ({ 
  mediaItem, 
  onClose = () => {},
  onNext = () => {},
  onPrevious = () => {},
  hasNext = false,
  hasPrevious = false,
  title = "Media Preview"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  if (!mediaItem) return null;

  // Determine media type
  const getMediaType = (item) => {
    if (item.type) return item.type;
    if (item.url) {
      const url = item.url.toLowerCase();
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) return 'video';
      if (url.includes('.pdf')) return 'pdf';
      if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.gif')) return 'image';
    }
    if (item.mimeType) {
      if (item.mimeType.startsWith('video/')) return 'video';
      if (item.mimeType.startsWith('image/')) return 'image';
      if (item.mimeType === 'application/pdf') return 'pdf';
    }
    return 'unknown';
  };

  const mediaType = getMediaType(mediaItem);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="media-preview-overlay" onClick={onClose}>
      <div 
        className={`media-preview-container ${mediaType}`} 
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="media-header">
          <div className="media-info">
            <h2 className="media-title">{title}</h2>
            <div className="media-type-indicator">
              <div className={`media-type-icon ${mediaType}`}>
                {mediaType === 'video' && <div className="video-icon"></div>}
                {mediaType === 'image' && <div className="image-icon"></div>}
                {mediaType === 'pdf' && <div className="pdf-icon"></div>}
                {mediaType === 'unknown' && <div className="file-icon"></div>}
              </div>
              <span className="media-type-label">
                {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              </span>
            </div>
          </div>

          <div className="media-controls">
            {mediaType === 'video' && (
              <button 
                className="fullscreen-btn"
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
              >
                <div className="fullscreen-icon"></div>
              </button>
            )}
            
            <button className="close-btn" onClick={onClose} title="Close">
              <div className="close-icon"></div>
            </button>
          </div>
        </div>

        {/* Media Content */}
        <div className="media-content">
          {mediaType === 'image' && (
            <div className="image-container">
              <img
                src={mediaItem.url || mediaItem.src}
                alt={mediaItem.title || mediaItem.name || 'Preview image'}
                className="preview-image"
              />
            </div>
          )}

          {mediaType === 'video' && (
            <div className="video-container">
              <video
                ref={videoRef}
                src={mediaItem.url || mediaItem.src}
                className="preview-video"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                controls={false}
              />
              
              {/* Video Controls Overlay */}
              <div className="video-controls-overlay">
                <div className="video-controls">
                  <button 
                    className={`play-pause-btn ${isPlaying ? 'playing' : 'paused'}`}
                    onClick={togglePlay}
                  >
                    {isPlaying ? (
                      <div className="pause-icon"></div>
                    ) : (
                      <div className="play-icon"></div>
                    )}
                  </button>

                  <div className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>

                  <div className="volume-control">
                    <div className="volume-icon"></div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                    />
                  </div>
                </div>

                <div className="progress-container" onClick={handleSeek}>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mediaType === 'pdf' && (
            <div className="pdf-container">
              <div className="pdf-preview">
                <iframe
                  src={`${mediaItem.url}#view=FitH`}
                  className="pdf-viewer"
                  title="PDF Preview"
                  loading="lazy"
                ></iframe>
                <div className="pdf-overlay">
                  <div className="pdf-info">
                    <div className="pdf-icon-large"></div>
                    <h3>PDF Document</h3>
                    <p>{mediaItem.name || 'Document.pdf'}</p>
                    <a 
                      href={mediaItem.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="pdf-download-btn"
                    >
                      <div className="download-icon"></div>
                      Open PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {mediaType === 'unknown' && (
            <div className="unknown-media">
              <div className="unknown-content">
                <div className="file-icon-large"></div>
                <h3>File Preview</h3>
                <p>{mediaItem.name || 'Unknown file type'}</p>
                <a 
                  href={mediaItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-btn"
                >
                  <div className="download-icon"></div>
                  Download File
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {hasPrevious && (
          <button className="nav-arrow prev" onClick={onPrevious}>
            <div className="arrow-icon left"></div>
          </button>
        )}

        {hasNext && (
          <button className="nav-arrow next" onClick={onNext}>
            <div className="arrow-icon right"></div>
          </button>
        )}

        {/* Media Info Footer */}
        <div className="media-footer">
          <div className="media-details">
            {mediaItem.name && <span className="file-name">{mediaItem.name}</span>}
            {mediaItem.size && <span className="file-size">{formatFileSize(mediaItem.size)}</span>}
            {mediaItem.dimensions && (
              <span className="dimensions">
                {mediaItem.dimensions.width} × {mediaItem.dimensions.height}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default MediaPreview;