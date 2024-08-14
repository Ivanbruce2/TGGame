import React, { useState } from 'react';
import './WalletDisplay.css'; // Assuming the CSS is in a separate file

const WalletDisplay = ({ walletAddress }) => {
  const [copyStatus, setCopyStatus] = useState('Copy');
  const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000); // Reset the button text after 2 seconds
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="wallet-display-container">
      <span className="wallet-address">{truncatedAddress}</span>
      <button 
        onClick={copyToClipboard} 
        className="copy-button"
      >
        {copyStatus}
      </button>
    </div>
  );
};

export default WalletDisplay;
