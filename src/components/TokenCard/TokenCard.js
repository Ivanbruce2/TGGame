import React, { useState, useEffect } from 'react';
import './TokenCard.css';
import Toast from '../Toast/Toast';

const TokenCard = ({ token, value, userID, sendMessage, users }) => { // users is now passed as a prop
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastLink, setToastLink] = useState('');

  const handleUserSelect = (e) => {
    const selectedUser = users.find(user => user.user_id === e.target.value);
    if (selectedUser) {
      setWalletAddress(selectedUser.wallet_address); // Auto-fill the wallet address
    }
  };

  const handleTransfer = () => {
    setToastMessage('Please wait...');
    setToastLink('');

    const amountToTransfer = parseFloat(transferAmount) * Math.pow(10, token.decimals);
    const amountToTransferStr = Math.floor(amountToTransfer).toString();

    const payload = {
      userID: userID.toString(),
      toAddress: walletAddress,
      amount: amountToTransferStr,
      contractAddress: token.address,
    };

    // Use sendMessage instead of fetch
    sendMessage({
      type: 'TRANSFER',
      ...payload,
    });

    // WebSocket responses should be handled in App.js
  };

  return (
    <div className="token-card">
      <div className="token-column">
        <h3 className="token-symbol">{token.symbol}</h3>
        <p className="token-amount">{tokenValue}</p>
      </div>
      <div className="token-column token-action">
        <button className="action-button" onClick={() => setIsModalOpen(true)}>Transfer</button>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Transfer {token.symbol}</h3>
            <select onChange={handleUserSelect}>
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.user_id} value={user.user_id}>
                  {user.username}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Wallet Address"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
            />
            <input
              type="number"
              placeholder={`Amount (${token.symbol})`}
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
            <button className="send-button" onClick={handleTransfer}>Send</button>
            <button className="cancel-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast message={toastMessage} link={toastLink} onClose={() => setToastMessage('')} />
      )}
    </div>
  );
};

export default TokenCard;
