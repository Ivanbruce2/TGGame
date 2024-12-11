<<<<<<< HEAD
import React, { useState } from 'react';
import './TokenCard.css';
import Toast from '../Toast/Toast';

const TokenCard = ({ token, value, userID, sendMessage, users, refreshTokens }) => {
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString(); // Human-readable format
  const maxTokenValue = value / Math.pow(10, token.decimals); // Actual value used for validation
=======
import React, { useState, useEffect } from 'react';
import './TokenCard.css';
import Toast from '../Toast/Toast';

const TokenCard = ({ token, value, userID, sendMessage, users }) => { // users is now passed as a prop
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString();
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastLink, setToastLink] = useState('');

<<<<<<< HEAD
  // Sort users alphabetically by username
  const sortedUsers = [...users].sort((a, b) => {
    return a.username.localeCompare(b.username);
  });

  const handleUserSelect = (e) => {
    const selectedUser = sortedUsers.find(user => user.user_id === e.target.value);
=======
  const handleUserSelect = (e) => {
    const selectedUser = users.find(user => user.user_id === e.target.value);
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
    if (selectedUser) {
      setWalletAddress(selectedUser.wallet_address); // Auto-fill the wallet address
    }
  };

  const handleTransfer = () => {
<<<<<<< HEAD
    if (!walletAddress) {
      setToastMessage('Please provide a valid wallet address.');
      setToastLink('');
      return;
    }

    if (parseFloat(transferAmount) > maxTokenValue) {
      setToastMessage(`Insufficient balance. You only have ${tokenValue} ${token.symbol}.`);
      setToastLink('');
      return;
    }

=======
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
    setToastMessage('Please wait...');
    setToastLink('');

    const amountToTransfer = parseFloat(transferAmount) * Math.pow(10, token.decimals);
    const amountToTransferStr = Math.floor(amountToTransfer).toString();

<<<<<<< HEAD
    if (token.type === 'native') {
      const payload = {
        userID: userID.toString(),
        toAddress: walletAddress,
        amount: amountToTransferStr,
        tokenType: 'native',
      };

      sendMessage({
        type: 'TRANSFER_NATIVE',
        ...payload,
      });
    } else {
      const payload = {
        userID: userID.toString(),
        toAddress: walletAddress,
        amount: amountToTransferStr,
        contractAddress: token.address,
      };

      sendMessage({
        type: 'TRANSFER',
        ...payload,
      });
    }

    setIsModalOpen(false);

    setTimeout(() => {
      refreshTokens(); 
    }, 1000);
  };

  const copyTokenAddressToClipboard = () => {
    if (token.address) {
      navigator.clipboard.writeText(token.address).then(() => {
        setToastMessage(`${token.symbol} address copied!`);
        setToastLink('');
      }, (err) => {
        console.error(`Failed to copy ${token.symbol} address: `, err);
        setToastMessage(`Failed to copy the ${token.symbol} address.`);
        setToastLink('');
      });
    }
=======
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
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
  };

  return (
    <div className="token-card">
      <div className="token-column">
<<<<<<< HEAD
        <h3 
          className="token-symbol" 
          onClick={copyTokenAddressToClipboard} 
          style={{ cursor: 'pointer' }}
        >
          {token.symbol}
        </h3>
=======
        <h3 className="token-symbol">{token.symbol}</h3>
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
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
<<<<<<< HEAD
              <option value="">Select a user (Optional)</option>
              {sortedUsers.map((user) => (
=======
              <option value="">Select a user</option>
              {users.map((user) => (
>>>>>>> 4cdb2999b95774f33e5e9aceecc6de4beded9952
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
