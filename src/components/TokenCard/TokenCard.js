import React, { useState } from 'react';
import './TokenCard.css';

const TokenCard = ({ token, value }) => {
  // Convert the value based on the token's decimals
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token.address).then(() => {
      console.log('Copied!');
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="token-card">
      <div className="token-column" onClick={copyToClipboard}>
        <h3 className="token-symbol">{token.symbol}</h3>
        <span className="tooltip-text">Click to copy address</span>
        <p className="token-amount">{tokenValue}</p>
      </div>
      <div className="token-column token-action">
        <button className="action-button">Action</button>
      </div>
    </div>
  );
};

export default TokenCard;
