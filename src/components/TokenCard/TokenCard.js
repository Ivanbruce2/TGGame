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
    // Validate that a wallet address is provided
    if (!walletAddress) {
      setToastMessage('Please provide a valid wallet address.');
      setToastLink('');
      return; // Prevent further execution
    }

    // Validate that the transfer amount is within the available balance
    if (parseFloat(transferAmount) > maxTokenValue) {
      setToastMessage(`Insufficient balance. You only have ${tokenValue} ${token.symbol}.`);
      setToastLink('');
      return; // Prevent further execution
    }

    setToastMessage('Please wait...');
    setToastLink('');

    const amountToTransfer = parseFloat(transferAmount) * Math.pow(10, token.decimals);
    const amountToTransferStr = Math.floor(amountToTransfer).toString();

    if (token.type === 'native') {
      // Special handling for Bones (native token)
      const payload = {
        userID: userID.toString(),
        toAddress: walletAddress,
        amount: amountToTransferStr,
        tokenType: 'native', // Distinguish that this is a native transfer
      };

      sendMessage({
        type: 'TRANSFER_NATIVE', // Specify a different type for native transfers
        ...payload,
      });
    } else {
      // Handling for ERC-20 tokens
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

    // Close modal and wait for WebSocket response
    setIsModalOpen(false);

    // Trigger the token refresh after transfer (optional delay can be added if needed)
    setTimeout(() => {
      refreshTokens(); // Refresh token data after successful transfer
    }, 1000);
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
