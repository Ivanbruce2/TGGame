import React, { useEffect, useState } from 'react';
import TokenCard from '../TokenCard/TokenCard';
import Toast from '../Toast/Toast'; // Import your custom Toast component
import './WalletDetails.css';

const WalletDetails = ({ walletAddress, backendURL, userID, sendMessage,users }) => { // Accept walletAddress as a prop
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boneAmount, setBoneAmount] = useState(null);
  const [toastVisible, setToastVisible] = useState(false); // State to control toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message
  const apiPrefix = "https://www.shibariumscan.io/api/v2";

  useEffect(() => {
    if (walletAddress) {
      const fetchTokensAndBone = async () => {
        try {
          // Fetch BONE balance using the prefix
          const response = await fetch(`${apiPrefix}/addresses/${walletAddress}`);
          const data = await response.json();

          // Calculate the BONE equivalent by dividing by 10^18
          const boneBalance = (parseFloat(data.coin_balance) / Math.pow(10, 18)).toFixed(3);
          setBoneAmount(boneBalance);

          // Fetch tokens using the prefix
          const tokenResponse = await fetch(`${apiPrefix}/addresses/${walletAddress}/token-balances`);
          const tokenData = await tokenResponse.json();

          if (Array.isArray(tokenData)) {
            setTokens(tokenData);
          } else {
            setError('Unexpected data format');
          }
        } catch (error) {
          console.error('Error fetching token or BONE data:', error);
          setError('Failed to fetch data');
        } finally {
          setLoading(false);
        }
      };

      fetchTokensAndBone();
    }
  }, [walletAddress, apiPrefix]); // Use the prefix as a dependency

  const copyToClipboard = () => {
    navigator.clipboard.writeText(walletAddress).then(() => {
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
        <b>Wallet:</b> 
        <span className="wallet-address" onClick={copyToClipboard} style={{ cursor: 'pointer' }}>
          {truncateAddress(walletAddress)}
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
                sendMessage={sendMessage}
                users={users} 
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
