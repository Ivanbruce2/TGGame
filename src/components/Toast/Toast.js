import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, link, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(); // Close the toast after 5 seconds
    }, 5000);

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

export default Toast;
