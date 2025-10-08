import React from 'react';
import html2canvas from 'html2canvas';
import Button from './Button';

const PdfExporter = ({ 
  elementRef, 
  filename, 
  title, 
  subtitle = null,
  buttonText = "Export",
  buttonColor = "Leaf"
}) => {
  const exportToPNG = async () => {
    try {
      // Get the element to capture
      const element = elementRef.current;
      if (!element) {
        alert('No content to export');
        return;
      }

      // A4 Landscape dimensions (297mm x 210mm) at 300 DPI
      const a4LandscapeWidth = 3508;  // 297mm * 300 DPI / 25.4
      const a4LandscapeHeight = 2480; // 210mm * 300 DPI / 25.4
      const a4Ratio = a4LandscapeWidth / a4LandscapeHeight; // ~1.414

      // Capture the element as canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        // Ensure input fields are properly captured
        ignoreElements: (element) => {
          // Don't ignore input elements, but ensure they're captured properly
          return false;
        },
        // Force input fields to be visible and properly sized
        onclone: (clonedDoc) => {
          // Ensure input fields maintain their styling in the cloned document
          const inputs = clonedDoc.querySelectorAll('input');
          inputs.forEach(input => {
            input.style.width = '100%';
            input.style.minWidth = '6ch';
            input.style.height = 'auto';
            input.style.minHeight = '4rem';
            input.style.fontSize = '3rem';
            input.style.padding = '0.6rem 1rem';
            input.style.border = 'none';
            input.style.backgroundColor = 'transparent';
            input.style.color = '#fff';
            input.style.fontFamily = 'RobotoCondensed, Arial, sans-serif';
            input.style.textAlign = 'left';
            input.style.boxSizing = 'border-box';
            input.style.display = 'block';
            input.style.overflow = 'visible';
            input.style.lineHeight = '1.2';
            input.style.margin = '0';
          });
        }
      });

      // Create a new canvas with A4 landscape dimensions
      const a4Canvas = document.createElement('canvas');
      a4Canvas.width = a4LandscapeWidth;
      a4Canvas.height = a4LandscapeHeight;
      const ctx = a4Canvas.getContext('2d');

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4LandscapeWidth, a4LandscapeHeight);

      // Scale content to fill the entire A4 canvas
      // Calculate scale factors to fill A4 dimensions
      const scaleX = a4LandscapeWidth / canvas.width;
      const scaleY = a4LandscapeHeight / canvas.height;
      
      // Use the larger scale to ensure content fills the canvas
      const scale = Math.max(scaleX, scaleY);
      
      // Calculate dimensions after scaling
      const scaledWidth = canvas.width * scale;
      const scaledHeight = canvas.height * scale;
      
      // Center the scaled content on the A4 canvas
      const offsetX = (a4LandscapeWidth - scaledWidth) / 2;
      const offsetY = (a4LandscapeHeight - scaledHeight) / 2;
      
      // Draw the scaled content to fill the A4 canvas
      ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert to PNG blob
      a4Canvas.toBlob((blob) => {
        if (blob) {
          // Create download link
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename || `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 0.95);
      
    } catch (error) {
      console.error('Error generating PNG:', error);
      alert('Error generating PNG. Please try again.');
    }
  };

  return (
    <Button
      name={buttonText}
      onPress={exportToPNG}
      color={buttonColor}
      size="medium"
      icon="→"
      iconPosition="right"
      customStyle={{ marginLeft: 'auto', marginTop: '0.5rem' }}
    />
  );
};

export default PdfExporter;

