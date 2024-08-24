import React, { useState, useEffect } from 'react';
import './WagerModal.css';

const WagerModal = ({ contracts, walletAddress, onSave, onCancel }) => {
  const [selectedContract, setSelectedContract] = useState('');
  const [wagerAmount, setWagerAmount] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0); // Default balance to 0
  const [tokenBalances, setTokenBalances] = useState([]); // Store all token balances
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Fetch token balances when the modal opens
    const fetchTokenBalances = async () => {
      try {
        const response = await fetch(`https://www.shibariumscan.io/api/v2/addresses/${walletAddress}/token-balances`);
        const data = await response.json();
        setTokenBalances(data);
      } catch (error) {
        console.error('Error fetching token balances:', error);
      }
    };

    fetchTokenBalances();
  }, [walletAddress]);

  useEffect(() => {
    // Update available balance whenever the selected contract changes
    if (selectedContract) {
      const contract = contracts.find(contract => contract.address === selectedContract);
      const tokenData = tokenBalances.find(token => token.token.address === selectedContract);

      if (contract) {
        const balance = tokenData ? parseFloat(tokenData.value) / Math.pow(10, contract.decimals) : 0;
        setAvailableBalance(balance);
        setErrorMessage(''); // Clear any previous error message
      }
    }
  }, [selectedContract, contracts, tokenBalances]);

  const handleSave = () => {
    if (!selectedContract) {
      alert('Please select a contract.');
      return;
    }

    if (parseFloat(wagerAmount) === 0 || isNaN(parseFloat(wagerAmount))) {
      setErrorMessage('Wager amount cannot be 0.');
      return;
    }

    const contract = contracts.find(contract => contract.address === selectedContract);

    if (contract) {
      const adjustedWagerAmount = parseFloat(wagerAmount) * Math.pow(10, contract.decimals);

      // Validate the wager amount against the available balance
      if (parseFloat(wagerAmount) > availableBalance) {
        setErrorMessage('Wager amount exceeds available balance.');
      } else {
        onSave(contract.address, adjustedWagerAmount.toString());
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Select Contract & Wager Amount</h2>
        <div className="form-group">
          <label>Contract Address:</label>
          <select
            value={selectedContract}
            onChange={(e) => setSelectedContract(e.target.value)}
          >
            <option value="">--Select Contract--</option>
            {contracts.map((contract, index) => (
              <option key={index} value={contract.address}>
                {contract.name} ({contract.symbol})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Wager Amount:</label>
          <input
            type="number"
            value={wagerAmount}
            onChange={(e) => setWagerAmount(e.target.value)}
            placeholder="Enter amount"
          />
          {availableBalance !== null && (
            <p>Available Balance: {availableBalance.toFixed(3)} {contracts.find(contract => contract.address === selectedContract)?.symbol}</p>
          )}
          {errorMessage && <p className="error-message">{errorMessage}</p>}
        </div>
        <div className="modal-actions">
          <button className="pixel-button save-button" onClick={handleSave}>
            Save
          </button>
          <button className="pixel-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default WagerModal;
