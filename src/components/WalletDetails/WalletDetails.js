import React, { useEffect, useState } from 'react';
import TokenCard from '../TokenCard/TokenCard'; // Adjust the import path as needed
import './WalletDetails.css'; // Import the CSS for the scrollable container

const WalletDetails = ({ walletAddress }) => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for walletAddress if it's undefined
  const [localWalletAddress, setLocalWalletAddress] = useState(walletAddress);

  useEffect(() => {
    // Fetch wallet address if it's not already provided
    if (!walletAddress) {
      const initializeUser = async () => {
        try {
          const response = await fetch('https://b0e804af9b97159966bd365b9c66b07e.serveo.net/initialize_user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              userid: "5199577425",
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
  }, [walletAddress]);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!localWalletAddress) return; // Don't fetch tokens until we have the wallet address

      try {
        const response = await fetch(`https://www.shibariumscan.io/api/v2/addresses/${localWalletAddress}/token-balances`);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setTokens(data);
        } else {
          setError('Unexpected data format');
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
        setError('Failed to fetch token data');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [localWalletAddress]);

  if (loading) {
    return <p>Loading token data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Wallet Details</h2>
      <p>Address: {localWalletAddress}</p>
      <div className="token-list-container"> {/* Scrollable container */}
        <div className="token-list">
          {tokens.length > 0 ? (
            tokens.map((tokenData, index) => (
              <TokenCard key={index} token={tokenData.token} value={tokenData.value} />
            ))
          ) : (
            <p>No tokens found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletDetails;
