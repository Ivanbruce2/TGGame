import React, { useState, useEffect } from 'react';
import './AdBanner.css';

const AdBanner = ({ ads }) => {
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  useEffect(() => {
    if (ads.length > 0) {
      const interval = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
      }, 5000); // Change the ad every 5 seconds

      return () => clearInterval(interval); // Clean up the interval
    }
  }, [ads]);

  if (ads.length === 0) return null; // Return null if no ads are available

  const currentAd = ads[currentAdIndex];

  const renderAdContent = (ad) => {
    const isVideo = ad.adslink.endsWith('.mp4') || ad.adslink.endsWith('.webm'); // Check for video format

    if (isVideo) {
      return (
        <video
          className="ad-banner-video"
          autoPlay
          muted
          loop
          playsInline
          // Hide controls and prevent interactions
          controls={false}
          disablePictureInPicture
        >
          <source src={ad.adslink} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    } else {
      return <img src={ad.adslink} alt="Ad Banner" className="ad-banner-image" />;
    }
  };

  return (
    <div className="ad-banner-wrapper">
      <div className="ad-banner-container">
        {/* New container for the advertisement bot message */}
        <div className="ads-message-container">
          <p>
            Need Ads? Visit{' '}
            <a href="https://t.me/ShibWareAdvertisementBot" target="_blank" rel="noopener noreferrer">
              https://t.me/ShibWareAdvertisementBot
            </a>
          </p>
        </div>

        <div className="ad-banner">
          <p className="ad-caption"><b>Ads: </b> {currentAd.caption}</p>
          <a href={currentAd.link} target="_blank" rel="noopener noreferrer">
            {renderAdContent(currentAd)}
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
