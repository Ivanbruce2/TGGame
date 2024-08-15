import React, { useState } from 'react';
import './TokenCard.css';

const TokenCard = ({ token, value }) => {
  // Convert the value based on the token's decimals
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString();
  const [copyStatus, setCopyStatus] = useState('Copy');

  const truncatedAddress = `${token.address.slice(0, 6)}...${token.address.slice(-4)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token.address).then(() => {
      setCopyStatus('Copied!');
      setTimeout(() => setCopyStatus('Copy'), 2000);
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  return (
    <div className="token-card">
      <div className="token-symbol">
        <h3>{token.symbol}</h3>
      </div>
      <div className="token-column token-amount">
        <p>{tokenValue}</p>
      </div>
      <div className="token-column token-address">
        <p className="address" onClick={copyToClipboard}>
          {truncatedAddress}
          <span className="copy-status">{` (${copyStatus})`}</span>
        </p>
      </div>
      <div className="token-column token-action">
        <button className="action-button">Action</button>
      </div>
    </div>
  );
};

export default TokenCard;
