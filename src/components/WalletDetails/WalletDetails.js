import React, { useEffect, useState } from 'react';
import TokenCard from '../TokenCard/TokenCard';
import Toast from '../Toast/Toast'; // Import your custom Toast component
import './WalletDetails.css';

const WalletDetails = ({ walletAddress, backendURL, userID }) => { // Accept the prefix as a prop
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localWalletAddress, setLocalWalletAddress] = useState(walletAddress);
  const [boneAmount, setBoneAmount] = useState(null);
  const [toastVisible, setToastVisible] = useState(false); // State to control toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message
  const apiPrefix="https://www.shibariumscan.io/api/v2" 
  useEffect(() => {
    if (!walletAddress) {
      const initializeUser = async () => {
        try {
          const response = await fetch(`${backendURL}/initialize_user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              userid: userID,
              username: "poemcryptoman",
            }),
          });

          const rawData = await response.text();

          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          const data = JSON.parse(rawData);
          setLocalWalletAddress(data.wallet_address);
        } catch (error) {
          console.error('Error initializing user:', error);
        }
      };

      initializeUser();
    }
  }, [walletAddress, backendURL, userID]);

  useEffect(() => {
    const fetchTokensAndBone = async () => {
      if (!localWalletAddress) return;

      try {
        // Fetch BONE balance using the prefix
        const response = await fetch(`${apiPrefix}/addresses/${localWalletAddress}`);
        const data = await response.json();

        // Calculate the BONE equivalent by dividing by 10^18
        const boneBalance = (parseFloat(data.coin_balance) / Math.pow(10, 18)).toFixed(3);
        setBoneAmount(boneBalance);

        // Fetch tokens using the prefix
        const tokenResponse = await fetch(`${apiPrefix}/addresses/${localWalletAddress}/token-balances`);
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
  }, [localWalletAddress, apiPrefix]); // Use the prefix as a dependency

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
