import React, { useState, useRef, useCallback } from 'react';
import EditableParagraph from './EditableParagraph';
import styles from './PhotoOfTheWeek.module.css';

const PhotoOfTheWeek = ({ 
  siteCode, 
  initialImage = null, 
  initialCaption = '', 
  onImageChange = () => {}, 
  onCaptionChange = () => {} 
}) => {
  const [image, setImage] = useState(initialImage);
  const [caption, setCaption] = useState(initialCaption);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Load saved data from localStorage on mount
  React.useEffect(() => {
    const savedImage = localStorage.getItem(`photo_${siteCode}`);
    const savedCaption = localStorage.getItem(`caption_${siteCode}`);
    
    if (savedImage) {
      setImage(savedImage);
    }
    if (savedCaption) {
      setCaption(savedCaption);
    }
  }, [siteCode]);

  const handleImageChange = useCallback((newImage) => {
    setImage(newImage);
    onImageChange(newImage);
    // Save to localStorage
    if (newImage) {
      localStorage.setItem(`photo_${siteCode}`, newImage);
    } else {
      localStorage.removeItem(`photo_${siteCode}`);
    }
  }, [siteCode, onImageChange]);

  const handleCaptionChange = useCallback((newCaption) => {
    setCaption(newCaption);
    onCaptionChange(newCaption);
    // Save to localStorage
    localStorage.setItem(`caption_${siteCode}`, newCaption);
  }, [onCaptionChange]);

  const handleFileSelect = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageDataUrl = e.target.result;
      handleImageChange(imageDataUrl);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      alert('Error reading file');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  }, [handleImageChange]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback((e) => {
    e.stopPropagation();
    handleImageChange(null);
  }, [handleImageChange]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.imageContainer} ${isDragOver ? styles.dragOver : ''} ${!image ? styles.empty : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading image...</p>
          </div>
        ) : image ? (
          <>
            <img 
              src={image} 
              alt="Photo of the week" 
              className={styles.image}
            />
            <button 
              className={styles.removeButton}
              onClick={handleRemoveImage}
              title="Remove image"
            >
              ×
            </button>
          </>
        ) : (
          <div className={styles.placeholder}>
            <div className={styles.uploadIcon}>📷</div>
            <p>Click or drag an image here</p>
            <p className={styles.hint}>Supports JPG, PNG, GIF</p>
          </div>
        )}
      </div>
      
      <div className={styles.captionContainer}>
        <EditableParagraph
          initialText={caption || ""}
          onSave={handleCaptionChange}
        />
      </div>
    </div>
  );
};

export default PhotoOfTheWeek;
