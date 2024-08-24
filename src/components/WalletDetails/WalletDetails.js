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

  useEffect(() => {
    if (walletAddress) {
      const fetchTokensAndBone = async () => {
        try {
          // Fetch BONE balance using the prefix
          const response = await fetch(`${apiPrefix}/addresses/${walletAddress}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch BONE data: ${response.statusText}`);
          }
          const data = await response.json();
  
          // Calculate the BONE equivalent by dividing by 10^18
          const boneBalance = (parseFloat(data.coin_balance) / Math.pow(10, 18)).toFixed(3);
          setBoneAmount(boneBalance);
  
          // Fetch tokens using the prefix
          const tokenResponse = await fetch(`${apiPrefix}/addresses/${walletAddress}/token-balances`);
          if (!tokenResponse.ok) {
            throw new Error(`Failed to fetch token data: ${tokenResponse.statusText}`);
          }
          const tokenData = await tokenResponse.json();
  
          if (Array.isArray(tokenData)) {
            // Exclude the manually added BONE token from contractAddresses mapping
            const mappedTokens = contractAddresses
              .filter(contract => contract.symbol !== 'BONES') // Exclude BONE from the mapping
              .map((contract) => {
                const matchingToken = tokenData.find((token) => token.token.address.toLowerCase() === contract.address.toLowerCase());
                return {
                  ...contract,
                  value: matchingToken ? matchingToken.value : "0", // If not found, default to "0"
                };
              });
  
            // Include BONE as a native token only once
            setTokens([
              {
                address: '',
                name: 'Bones',
                symbol: 'BONES',
                decimals: 18,
                type: 'native',
                value: data.coin_balance, // The raw BONE balance value
              },
              ...mappedTokens,
            ]);
          } else {
            setError('Unexpected data format');
          }
        } catch (error) {
          console.error('Error fetching token or BONE data:', error);
          // Set boneAmount to "0" if the fetch fails
          setBoneAmount("0");
          setError('Failed to fetch token or BONE data, showing default values.');
        } finally {
          setLoading(false);
        }
      };
  
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

  if (error) {
    return <p>{error}</p>;
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
