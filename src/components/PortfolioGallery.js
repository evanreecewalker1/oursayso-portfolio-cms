import React, { useState, useEffect, useRef, useCallback } from 'react';
import './PortfolioGallery.css';

const PortfolioGallery = ({ 
  images = [], 
  title = "Gallery", 
  autoPlay = false, 
  autoPlayInterval = 5000,
  showThumbnails = true,
  onImageChange = () => {},
  onClose = () => {}
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEndIndicator, setShowEndIndicator] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState('');
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const imageRefs = useRef([]);

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      intervalRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, images.length, autoPlayInterval]);

  // Check if we're at the end of the gallery
  useEffect(() => {
    const isAtEnd = currentIndex === images.length - 1;
    setShowEndIndicator(isAtEnd);
    onImageChange(currentIndex, images[currentIndex]);
  }, [currentIndex, images.length, images, onImageChange]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    if (currentIndex < images.length - 1) {
      setIsTransitioning(true);
      setSwipeDirection('next');
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
        setSwipeDirection('');
      }, 150);
    } else {
      // Show end stop indicator
      setShowEndIndicator(true);
      setTimeout(() => setShowEndIndicator(false), 2000);
    }
  }, [currentIndex, images.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    
    if (currentIndex > 0) {
      setIsTransitioning(true);
      setSwipeDirection('prev');
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(false);
        setSwipeDirection('');
      }, 150);
    }
  }, [currentIndex, isTransitioning]);

  const goToImage = useCallback((index) => {
    if (index >= 0 && index < images.length && index !== currentIndex && !isTransitioning) {
      setIsTransitioning(true);
      setSwipeDirection(index > currentIndex ? 'next' : 'prev');
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
        setSwipeDirection('');
      }, 150);
    }
  }, [currentIndex, images.length, isTransitioning]);

  // Touch/swipe handlers (fixed implementation)
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setTouchStart({ 
      x: touch.clientX, 
      y: touch.clientY 
    });
    setTouchEnd({ 
      x: touch.clientX, 
      y: touch.clientY 
    });
  }, []);

  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    setTouchEnd({ 
      x: touch.clientX, 
      y: touch.clientY 
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;
    const maxVerticalDistance = 100;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaY) > maxVerticalDistance) return;
    
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swiped left - go to next image
        goToNext();
      } else {
        // Swiped right - go to previous image
        goToPrevious();
      }
    }
    
    // Reset touch positions
    setTouchStart({ x: 0, y: 0 });
    setTouchEnd({ x: 0, y: 0 });
  }, [touchStart, touchEnd, goToNext, goToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToPrevious, goToNext, onClose]);

  if (!images || images.length === 0) {
    return (
      <div className="portfolio-gallery empty">
        <div className="empty-gallery">
          <div className="gallery-icon">📸</div>
          <h3>No Images Available</h3>
          <p>This gallery is empty.</p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const isAtEnd = currentIndex === images.length - 1;
  const isAtStart = currentIndex === 0;

  return (
    <div className="portfolio-gallery" ref={containerRef}>
      {/* Gallery Header */}
      <div className="gallery-header">
        <div className="gallery-info">
          <h2 className="gallery-title">{title}</h2>
          <span className="image-counter">
            {currentIndex + 1} of {images.length}
          </span>
        </div>
        
        <div className="gallery-controls">
          <button
            className={`play-pause-btn ${isPlaying ? 'playing' : 'paused'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={images.length <= 1}
          >
            {isPlaying ? (
              <div className="pause-icon"></div>
            ) : (
              <div className="play-icon"></div>
            )}
          </button>
          
          <button className="close-btn" onClick={onClose}>
            <div className="close-icon"></div>
          </button>
        </div>
      </div>

      {/* Main Image Display */}
      <div 
        className={`gallery-main ${isTransitioning ? 'transitioning' : ''} ${swipeDirection}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="image-container">
          <img
            ref={el => imageRefs.current[currentIndex] = el}
            src={currentImage?.url || currentImage?.src}
            alt={currentImage?.alt || currentImage?.title || `Image ${currentIndex + 1}`}
            className="main-image"
            loading="eager"
            onLoad={() => {
              // Preload adjacent images for smooth transitions
              if (currentIndex < images.length - 1) {
                const nextImg = new Image();
                nextImg.src = images[currentIndex + 1]?.url || images[currentIndex + 1]?.src;
              }
              if (currentIndex > 0) {
                const prevImg = new Image();
                prevImg.src = images[currentIndex - 1]?.url || images[currentIndex - 1]?.src;
              }
            }}
          />

          {/* Navigation Arrows */}
          <button
            className={`nav-arrow prev ${isAtStart ? 'disabled' : ''}`}
            onClick={goToPrevious}
            disabled={isAtStart || isTransitioning}
          >
            <div className="arrow-icon left"></div>
          </button>

          <button
            className={`nav-arrow next ${isAtEnd ? 'disabled' : ''}`}
            onClick={goToNext}
            disabled={isTransitioning}
          >
            <div className="arrow-icon right"></div>
          </button>

          {/* End Stop Indicator */}
          {showEndIndicator && isAtEnd && (
            <div className="end-stop-indicator">
              <div className="end-stop-content">
                <div className="end-stop-icon">🏁</div>
                <span className="end-stop-text">End of Gallery</span>
                <div className="end-stop-subtext">
                  {images.length} image{images.length !== 1 ? 's' : ''} total
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="gallery-progress">
        <div 
          className="progress-bar"
          style={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
        ></div>
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && images.length > 1 && (
        <div className="thumbnail-strip">
          <div className="thumbnails-container">
            {images.map((image, index) => (
              <button
                key={image.id || index}
                className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToImage(index)}
                disabled={isTransitioning}
              >
                <img
                  src={image.thumbnail || image.url || image.src}
                  alt={`Thumbnail ${index + 1}`}
                  loading="lazy"
                />
                {index === currentIndex && <div className="thumbnail-indicator"></div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Swipe Hint (for touch devices) */}
      {images.length > 1 && (
        <div className="swipe-hint">
          <div className="swipe-icon left"></div>
          <span>Swipe to navigate</span>
          <div className="swipe-icon right"></div>
        </div>
      )}
    </div>
  );
};

export default PortfolioGallery;