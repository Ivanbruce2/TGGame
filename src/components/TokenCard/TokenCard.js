import React, { useState } from 'react';
import './TokenCard.css';
import Toast from '../Toast/Toast';

const TokenCard = ({ token, value, userID, sendMessage, users, refreshTokens }) => {
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString(); // Human-readable format
  const maxTokenValue = value / Math.pow(10, token.decimals); // Actual value used for validation
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

    setToastMessage('Please wait...');
    setToastLink('');

    const amountToTransfer = parseFloat(transferAmount) * Math.pow(10, token.decimals);
    const amountToTransferStr = Math.floor(amountToTransfer).toString();

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
        setToastMessage(`${token.symbol} address copied: ${token.address}`);
        setToastLink('');
      }, (err) => {
        console.error(`Failed to copy ${token.symbol} address: `, err);
        setToastMessage(`Failed to copy the ${token.symbol} address.`);
        setToastLink('');
      });
    }
  };
  

  return (
    <div className="token-card">
      <div className="token-column">
        <u><h3 
          className="token-symbol" 
          onClick={copyTokenAddressToClipboard} 
          style={{ cursor: 'pointer' }}
        >
          {token.symbol}
        </h3></u>
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
              <option value="">Select a user (Optional)</option>
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
