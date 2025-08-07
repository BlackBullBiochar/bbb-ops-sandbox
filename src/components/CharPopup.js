
import React from 'react';

const CharPopup = ({ children, message }) => {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div className="popup-trigger">
        {children}
      </div>
      <div className="popup-message">
        {message}
      </div>

      <style jsx>{`
        .popup-message {
          visibility: hidden;
          background-color: black;
          color: white;
          text-align: center;
          padding: 5px 10px;
          border-radius: 4px;
          position: absolute;
          z-index: 1;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          white-space: nowrap;
        }

        .popup-trigger:hover + .popup-message {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default CharPopup;
