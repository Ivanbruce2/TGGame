import React, { useState } from 'react';
import './TokenCard.css';
import Toast from '../Toast/Toast';

const TokenCard = ({ token, value, backendURL, userID }) => {
  const tokenValue = (value / Math.pow(10, token.decimals)).toLocaleString();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [transactionStatus, setTransactionStatus] = useState(''); // State to hold the transfer status message
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message
  const [toastLink, setToastLink] = useState(''); // State for the toast link

  const copyToClipboard = () => {
    navigator.clipboard.writeText(token.address).then(() => {
      console.log('Copied!');
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleTransfer = async () => {
    setToastMessage('Please wait...'); // Show the "Please wait..." toast before starting the transfer
    setToastLink(''); // No link for this toast message
    setTransactionStatus(''); // Reset status before starting the transfer
    let result = {};

    const amountToTransfer = parseFloat(transferAmount) * Math.pow(10, token.decimals);
    const amountToTransferStr = Math.floor(amountToTransfer).toString();

    const payload = {
      userID, // Include userID in the payload
      to: walletAddress,
      amount: amountToTransferStr,
      contractAddress: token.address,
    };

    try {
      const response = await fetch(`${backendURL}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      result = await response.json();
      if (result.success) {
        setToastMessage('Transfer successful!'); // Update toast message
        setToastLink(`https://www.shibariumscan.io/tx/${result.txHash}`); // Set the link for the successful transaction
      } else {
        setToastMessage(`Transfer failed: ${result.error}`);
        setToastLink(''); // No link for failed transactions
      }
    } catch (error) {
      console.error('Error during transfer:', error);
      setToastMessage('Transfer failed due to an error.');
      setToastLink('');
    } finally {
      if (result.success) {
        setTimeout(() => {
          setIsModalOpen(false);
          setTransferAmount('');
          setWalletAddress('');
          setTransactionStatus(''); // Clear the status after closing the modal
        }, 3000);
      }
    }
  };

  return (
    <div className="token-card">
      <div className="token-column" onClick={copyToClipboard}>
        <h3 className="token-symbol">{token.symbol}</h3>
        <span className="tooltip-text">Click to copy address</span>
        <p className="token-amount">{tokenValue}</p>
      </div>
      <div className="token-column token-action">
        <button className="action-button" onClick={() => setIsModalOpen(true)}>Transfer</button>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h3>Transfer {token.symbol}</h3>
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

      {/* Display the toast if there is a message */}
      {toastMessage && (
        <Toast message={toastMessage} link={toastLink} onClose={() => setToastMessage('')} />
      )}
    </div>
  );
};

export default TokenCard;
