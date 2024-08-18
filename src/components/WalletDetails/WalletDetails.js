import React, { useEffect, useState, useRef } from 'react';
import TokenCard from '../TokenCard/TokenCard';
import Toast from '../Toast/Toast'; // Import your custom Toast component
import './WalletDetails.css';

const WalletDetails = ({ walletAddress, backendURL, userID, wsPrefix }) => { // Accept the wsPrefix as a prop
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localWalletAddress, setLocalWalletAddress] = useState(walletAddress);
  const [boneAmount, setBoneAmount] = useState(null);
  const [toastVisible, setToastVisible] = useState(false); // State to control toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message

  const ws = useRef(null); // UseRef to store the WebSocket instance

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket(`${wsPrefix}`);

    ws.current.onopen = () => {
      console.log('WebSocket connection established');

      if (!walletAddress) {
        // Send user initialization data via WebSocket when connected
        ws.current.send(JSON.stringify({
          type: 'initialize_user',
          userID: userID,
          username: "poemcryptoman"
        }));
      }
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'wallet_address') {
        setLocalWalletAddress(data.wallet_address);
      } else if (data.type === 'token_data') {
        setTokens(data.tokens);
        setBoneAmount(data.boneAmount);
        setLoading(false);
      } else if (data.type === 'error') {
        setError(data.message);
        setLoading(false);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [walletAddress, wsPrefix, userID]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localWalletAddress).then(() => {
      // Trigger the toast with a success message
      setToastMessage('Wallet address copied!');
      setToastVisible(true);
    }, (err) => {
      console.error('Failed to copy text: ', err);
      setToastMessage('Failed to copy the address.');
      setToastVisible(true);
    });
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return <p>Loading token data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2 className="welcome-message">Wallet Details</h2>
      <p>
        Address: 
        <span className="wallet-address" onClick={copyToClipboard} style={{ cursor: 'pointer' }}>
          {truncateAddress(localWalletAddress)}
        </span>
        {boneAmount && (
          <span className="bone-amount"> ({boneAmount} BONE)</span>
        )}
      </p>
      <div className="token-list-container">
        <div className="token-list">
          {tokens.length > 0 ? (
            tokens.map((tokenData, index) => (
              <TokenCard
                key={index}
                token={tokenData.token}
                value={tokenData.value}
                backendURL={backendURL}
                userID={userID}
              />
            ))
          ) : (
            <p>No tokens found.</p>
          )}
        </div>
      </div>

      {/* Render the toast if visible */}
      {toastVisible && (
        <Toast 
          message={toastMessage} 
          onClose={() => setToastVisible(false)} // Hide the toast after 5 seconds
        />
      )}
    </div>
  );
};

export default WalletDetails;
