import React, { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Image, Upload, X } from 'lucide-react';
import './GalleryBuilder.css';

const GalleryBuilder = ({ gallery, onGalleryUpdate, onUploadImages, isUploading }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const images = gallery?.images || [];

  // Handle drag and drop reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    
    // Remove from old position
    newImages.splice(draggedIndex, 1);
    
    // Insert at new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newImages.splice(insertIndex, 0, draggedImage);
    
    // Update gallery
    onGalleryUpdate({
      ...gallery,
      images: newImages,
      title: `🖼️ Project Gallery (${newImages.length} image${newImages.length !== 1 ? 's' : ''})`
    });
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Please select image files only.');
      return;
    }

    console.log(`📸 Uploading ${imageFiles.length} images to gallery...`);
    
    try {
      await onUploadImages(imageFiles);
    } catch (error) {
      console.error('Gallery upload failed:', error);
      alert('Failed to upload images. Please try again.');
    }
  };

  // Handle remove image
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onGalleryUpdate({
      ...gallery,
      images: newImages,
      title: `🖼️ Project Gallery (${newImages.length} image${newImages.length !== 1 ? 's' : ''})`
    });
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  return (
    <div className="gallery-builder">
      <div className="gallery-header">
        <div className="gallery-title">
          <Image size={20} />
          <span>{gallery?.title || '🖼️ Project Gallery'}</span>
          <span className="image-count">({images.length} image{images.length !== 1 ? 's' : ''})</span>
        </div>
        
        <button
          className="add-images-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="upload-spinner"></div>
              Uploading...
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Images
            </>
          )}
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {images.length === 0 ? (
        <div className="gallery-empty-state">
          <div className="empty-drop-zone"
            onDrop={(e) => {
              e.preventDefault();
              handleFileUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.preventDefault()}
          >
            <Upload size={48} />
            <h3>Drop images here or click to upload</h3>
            <p>Create a beautiful image gallery for your project</p>
            <button 
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Choose Images'}
            </button>
          </div>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className={`gallery-thumbnail ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="image-container">
                <img
                  src={image.url || image.preview}
                  alt={image.name || `Gallery image ${index + 1}`}
                  className="thumbnail-image"
                  onClick={() => setPreviewImage(image)}
                />
                
                {/* Drag handle */}
                <div className="drag-handle">
                  <GripVertical size={14} />
                </div>
                
                {/* Remove button */}
                <button
                  className="remove-image-btn"
                  onClick={() => handleRemoveImage(index)}
                  title="Remove image"
                >
                  <Trash2 size={14} />
                </button>
                
                {/* Upload status indicator */}
                {image.uploading ? (
                  <div className="upload-overlay">
                    <div className="upload-spinner"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="upload-success-indicator">
                    ✅ {image.storageType === 'cloudinary' ? 'Cloudinary' : 'Uploaded'}
                  </div>
                )}
              </div>
              
              <div className="image-info">
                <span className="image-name">{image.name || 'Untitled'}</span>
                <span className="image-size">{formatFileSize(image.size || 0)}</span>
              </div>
            </div>
          ))}
          
          {/* Add more images tile */}
          <div className="add-more-tile" onClick={() => fileInputRef.current?.click()}>
            <Plus size={32} />
            <span>Add More</span>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="image-preview-modal" onClick={() => setPreviewImage(null)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-preview-btn"
              onClick={() => setPreviewImage(null)}
            >
              <X size={24} />
            </button>
            <img
              src={previewImage.url || previewImage.preview}
              alt={previewImage.name || 'Gallery image'}
              className="preview-image"
            />
            <div className="preview-info">
              <h3>{previewImage.name || 'Gallery Image'}</h3>
              <p>{formatFileSize(previewImage.size || 0)} • Uploaded {formatDate(previewImage.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  return new Date(dateString).toLocaleDateString();
};

export default GalleryBuilder;