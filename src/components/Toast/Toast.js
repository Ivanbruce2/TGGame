// Toast.js
import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, link, onClose }) => {
  useEffect(() => {
<<<<<<< HEAD
    const timer = setTimeout(onClose, 3000); // Automatically close the toast after 5 seconds
=======
    const timer = setTimeout(onClose, 5000); // Automatically close the toast after 5 seconds
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
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
