import React from 'react';
import './AdBanner.css';

const AdBanner = () => {
  return (
    <div className="ad-banner-container">
      <div className="ad-banner">
        {/* Replace this with your ad image */}
        <img src="https://via.placeholder.com/320x50" alt="Ad Banner" className="ad-banner-image" />
      </div>
      <p className="ad-caption">Your caption goes here.</p>
    </div>
  );
};

export default AdBanner;
