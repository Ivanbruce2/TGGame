// Toast.js
import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, link, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000); // Automatically close the toast after 5 seconds
    return () => clearTimeout(timer); // Clean up the timer on component unmount
  }, [onClose]);

  return (
    <div className="toast">
      <p>
        {message}
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="toast-link">
            View on ShibariumScan
          </a>
        )}
      </p>
    </div>
  );
};

export default Toast; // Ensure that you are using default export here
