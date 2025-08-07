import React, { useState } from 'react';

const IndiPopup = ({ children, popupContent }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          style={{
            position: 'absolute',
            top: '120%',
            left: '0',
            backgroundColor: 'white',
            color: '#333',
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 999,
            minWidth: '180px'
          }}
        >
          {popupContent}
        </div>
      )}
    </span>
  );
};

export default IndiPopup;
