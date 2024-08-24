import React, { useEffect, useState } from 'react';
import TokenCard from '../TokenCard/TokenCard';
import Toast from '../Toast/Toast'; // Import your custom Toast component
import './WalletDetails.css';

const WalletDetails = ({ walletAddress, backendURL, userID, sendMessage, users, contractAddresses }) => { // Accept walletAddress as a prop

  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [boneAmount, setBoneAmount] = useState("0"); // Default to 0 if fetch fails
  const [toastVisible, setToastVisible] = useState(false); // State to control toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for the toast message
  const apiPrefix = "https://www.shibariumscan.io/api/v2";

  const fetchTokensAndBone = async () => {
    try {
      // Fetch BONE balance using the prefix
      const response = await fetch(`${apiPrefix}/addresses/${walletAddress}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch BONE data: ${response.status}`);
      }
      const data = await response.json();

      // Calculate the BONE equivalent by dividing by 10^18
      const boneBalance = (parseFloat(data.coin_balance) / Math.pow(10, 18)).toFixed(3);
      setBoneAmount(boneBalance);

      // Fetch tokens using the prefix
      const tokenResponse = await fetch(`${apiPrefix}/addresses/${walletAddress}/token-balances`);
      if (!tokenResponse.ok) {
        throw new Error(`Failed to fetch token data: ${tokenResponse.status}`);
      }
      const tokenData = await tokenResponse.json();

      if (Array.isArray(tokenData)) {
        const mappedTokens = contractAddresses.map((contract) => {
          const matchingToken = tokenData.find((token) => token.token.address.toLowerCase() === contract.address.toLowerCase());
          return {
            ...contract,
            value: matchingToken ? matchingToken.value : "0", // Default to "0" if not found
          };
        });

        // Include BONE token manually
        setTokens([
          {
            address: '',
            name: 'BONE',
            symbol: 'BONE',
            decimals: 18,
            type: 'native',
            value: data.coin_balance || "0", // The raw BONE balance value, or "0" if not available
          },
          ...mappedTokens,
        ]);
      } else {
        throw new Error('Unexpected data format');
      }
    } catch (error) {
      console.error('Error fetching token or BONE data:', error);
      // Even if there is an error, still show the tokens from contractAddresses with "0" as value
      const mappedTokens = contractAddresses.map((contract) => ({
        ...contract,
        value: "0", // Default all token amounts to "0" in case of an error
      }));

      // Include BONE token manually in case of an error
      setTokens([
        {
          address: '',
          name: 'BONE',
          symbol: 'BONE',
          decimals: 18,
          type: 'native',
          value: "0", // Set BONE to "0" in case of an error
        },
        ...mappedTokens,
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTokensAndBone();
    }
  }, [walletAddress, apiPrefix, contractAddresses]);

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

  return (
    <div>
      <h2 className="welcome-message">Wallet Details</h2>
      <p>
        <span className="wallet-address" onClick={copyToClipboard} style={{ cursor: 'pointer' }}>
          {walletAddress}
        </span>
      </p>
      <div className="token-list-container">
        <div className="token-list">
          {tokens.length > 0 ? (
            tokens.map((tokenData, index) => (
              <TokenCard
                key={index}
                token={tokenData} // Pass the entire token object, including type and value
                value={tokenData.value} // Pass the value (in raw smallest units)
                backendURL={backendURL}
                userID={userID}
                sendMessage={sendMessage}
                users={users}
                refreshTokens={fetchTokensAndBone} // Pass the refresh function to TokenCard
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
