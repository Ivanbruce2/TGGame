import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WalletDetails from './components/WalletDetails/WalletDetails';
import NavBar from './components/NavBar/NavBar';
import WagerModal from './components/WagerModal/WagerModal';
import Toast from './components/Toast/Toast';
import './App.css';
import { retrieveLaunchParams } from '@telegram-apps/sdk';


// Define the backend URL once in a central location
const backendURL = 'https://905f52431640c8e483a145804a8ae7c7.serveo.net';

function App() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const [userID, setUserID] = useState('');
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(''); // New state for toast messages
const [toastLink, setToastLink] = useState(''); // State for an optional link in the toast
const [toastVisible, setToastVisible] = useState(false); // State to control the visibility of the toast

  const pollingRef = useRef(null);
  const roomPollingRef = useRef(null);
  const contractAddresses = [
    { address: '0xA77241231a899b69725F2e2e092cf666286Ced7E', name: 'ShibWare', symbol: 'ShibWare', decimals: 18 },
    { address: '0x43AB6e79a0ee99e6cF4eF9e70b4C0c2DF5A4d0Fb', name: 'CRYPTIQ', symbol: 'CTQ', decimals: 18 },
  ];

  useEffect(() => {
    const retrievedUsername = initData.user.username || "Unknown Username";
    const retrievedUserID = initData.user.id || "Unknown UserID";
    setUserID(retrievedUserID);
    setUsername(retrievedUsername);

    initializeUser(retrievedUserID, retrievedUsername);
    window.addEventListener('beforeunload', handleBeforeUnload);
fetchRooms()
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveGame();
      clearInterval(roomPollingRef.current);
    };
  }, [selectedRoom]);

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const performFetch = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${backendURL}${endpoint}`, options);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  const fetchRooms = async () => {
    try {
      const data = await performFetch('/list_rooms');
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const startPollingRooms = () => {
    roomPollingRef.current = setInterval(fetchRooms, 5000);
  };

  const initializeUser = async (userID, username) => {
    try {
      const data = await performFetch('/initialize_user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
        }),
      });
      setWalletAddress(data.wallet_address);
      console.log(data.wallet_address);
    } catch (error) {
      console.error('Error initializing user:', error);
    }
  };

  const startPollingChoices = (roomId) => {
    let transferInitiated = false; // Flag to track if the transfer has already been initiated
  
    try {
      const pollGameStatus = async () => {
        try {
          const data = await performFetch(`/game_status?room_id=${roomId}`);
          setGameStatus(data);
          console.log(data);
  
          if (data.status === "completed") {
            clearInterval(pollingRef.current);
  
            if (!transferInitiated) { // Check if the transfer has already been triggered
              transferInitiated = true; // Mark transfer as initiated
  
              // Trigger the token transfer
              await triggerTokenTransfer(roomId);
            }
          }
        } catch (error) {
          clearInterval(pollingRef.current);
          setSelectedRoom(null);
          setGameStatus(null);
        }
      };
  
      clearInterval(pollingRef.current);
      pollingRef.current = setInterval(pollGameStatus, 1000);
    } catch (error) {
      console.error("Error in startPollingChoices:", error);
    }
  };
  
  const triggerTokenTransfer = async (roomId) => {
    try {
      const response = await performFetch('/trigger_transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room_id: roomId }),
      });
  console.log("do i come here?")
  console.log(response)
      if (response.txHash) {
        setToastMessage('Game completed! Tokens have been transferred.');
        setToastLink(`https://shibariumscan.io/tx/${response.txHash}`); // Update with the actual transaction link
        setToastVisible(true);
      } else {
        setToastMessage('Game completed!');
        setToastLink(''); // No link if there's no transaction
        setToastVisible(true);
      }
    } catch (error) {
      console.error("Error in triggerTokenTransfer:", error);
    }
  };
  

  
  const createRoom = async (contractAddress, wagerAmount) => {
    try {
      const data = await performFetch('/create_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
          contract_address: contractAddress,
          wager_amount: wagerAmount,
        }),
      });
      setSelectedRoom(data.room_id);
      startPollingChoices(data.room_id);
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSaveModal = (contractAddress, wagerAmount) => {
    setIsModalOpen(false);
    createRoom(contractAddress, wagerAmount); // Pass the contract address and wager amount to the createRoom function
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  const joinRoom = async (roomId) => {
    try {
      const data = await performFetch('/join_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
          room_id: roomId,
          wallet_address: walletAddress, // Send wallet address
        }),
      });
  
      if (data && data.room_id) {
        setSelectedRoom(data.room_id);
        startPollingChoices(data.room_id);
      } else if (data && data.error) {
        // Set the toast message with the error
        setToastMessage(data.error);
        setToastLink(''); // No link needed for errors
        setToastVisible(true); // Show the toast
      }
    } catch (error) {
      console.error("Error in joinRoom:", error);
      setToastMessage('Failed to join the room due to an error.');
      setToastLink(''); // No link needed for errors
      setToastVisible(true); // Show the toast
    }
  };
  
  
  

  const handleChoice = async (choice) => {
    setUserChoice(choice);
  
    try {
      const data = await performFetch('/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
          choice: choice,
          room_id: selectedRoom,
        }),
      });
  
      setGameStatus(data);
  
     
    } catch (error) {
      console.error("Error in handleChoice:", error);
    }
  };
  

  const leaveGame = async () => {
    if (selectedRoom) {
      await performFetch('/leave_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
          room_id: selectedRoom,
        }),
      });

      setSelectedRoom(null);
      setGameStatus(null);
      setUserChoice('');
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(pollingRef.current);
      clearInterval(roomPollingRef.current);
    };
  }, []);

  const WalletDisplay = ({ walletAddress }) => {
    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setToastMessage('Wallet address copied to clipboard!'); // Trigger toast message
      }, (err) => {
        console.error('Failed to copy text: ', err);
      });
    };

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '10px', cursor: 'pointer' }} onClick={copyToClipboard}>
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#FFD700', marginRight: '8px' }}>
          {truncatedAddress}
        </span>
      </div>
    );
  };

  return (
    <div className="App">
      {selectedRoom ? (
        <>
          <h1 className="welcome-message2">Room: {selectedRoom}</h1>
          {gameStatus ? (
            <>
              <h2 className="game-status">
                {gameStatus.player1_username ? `${gameStatus.player1_username} ${gameStatus.player1_choice ? '✔️' : '❓'}` : '[Pending]'}
                {' vs '}
                {gameStatus.player2_username ? `${gameStatus.player2_username} ${gameStatus.player2_choice ? '✔️' : '❓'}` : '[Pending]'}
              </h2>

              {gameStatus.status !== 'completed' && (
                <>
                  <div className="choices">
                    {["Scissors", "Paper", "Stone"].map(choice => (
                      <button
                        key={choice}
                        className="choice-button"
                        onClick={() => handleChoice(choice)}
                        disabled={!!userChoice}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>

                  <p>Waiting for opponent...</p>
                </>
              )}

              <button className="return-button" onClick={leaveGame}>
                Return to Lobby
              </button>

              {gameStatus.status === 'completed' && (
                <div>
                  {gameStatus.result?.includes('draw') ? (
                    <p>It's a Draw! Both players chose {gameStatus.player1_choice}.</p>
                  ) : (
                    <>
                      <p>{gameStatus.result?.split('! ')[1]}</p>
                      <h2>
                        {gameStatus.result?.includes(username) ? 'You Win!' : 'You Lose...'}
                      </h2>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <p>Select your choice below:</p>
              <div className="choices">
                {["Scissors", "Paper", "Stone"].map(choice => (
                  <button
                    key={choice}
                    className="choice-button"
                    onClick={() => handleChoice(choice)}
                    disabled={!!userChoice}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p>Please select a room.</p>
      )}

      {/* Render the toast if it’s visible */}
      {toastVisible && (
        <div className="toast">
          <p>{toastMessage}</p>
          {toastLink && (
            <a href={toastLink} target="_blank" rel="noopener noreferrer">
              View Transaction
            </a>
          )}
        </div>
      )}
    </div>
  );
};
  

  return (
    <Router>
      <div className="App">
        <NavBar />
        <div className="container">
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <h1 className="welcome-message">Welcome, {username}</h1>
                  <p>
                    <b>Wallet: </b>
                    <WalletDisplay walletAddress={walletAddress} />
                  </p>
                  <div className="header-row">
                    <button className="pixel-button create-button" onClick={handleOpenModal}>
                      Create Room
                    </button>
                    <button className="pixel-button refresh-button" onClick={fetchRooms}>
                      ↻
                    </button>
                  </div>
                  <div className="room-list">
                    {Object.values(rooms).map((room) => {
                      // Find the corresponding contract info
                      const contract = contractAddresses.find(
                        (c) => c.address === room.contract_address
                      );
                      // Determine decimals, fallback to 1 if not found
                      const decimals = contract ? contract.decimals : 1;
                      // Convert the wager amount by dividing by 10^decimals
                      const formattedWagerAmount = room.wager_amount
                        ? (parseFloat(room.wager_amount) / Math.pow(10, decimals)).toFixed(3)
                        : 'N/A';

                      return (
                        <div className="room-card" key={room.room_id}>
                          <div className="room-details">
                            <p>Room ID: {room.room_id} | {room.status === 'waiting'
                                ? `Player: ${room.player1_username}`
                                : `${room.player1_username} vs ${room.player2_username}`}</p>                          
                            
                            <p>Wager: {contract ? `(${contract.symbol})` : 'N/A'} | {formattedWagerAmount}</p> {/* Display the token name and symbol */}
                          
                            {/* <p>Status: {room.status === 'waiting' ? 'Waiting for opponent' : room.status}</p> */}
                          </div>
                          {room.status === 'waiting' && (
                            <button className="join-button" onClick={() => joinRoom(room.room_id)}>
                              <b>JOIN</b>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              }
            />
            <Route
              path="/wallet-details"
              element={<WalletDetails walletAddress={walletAddress} backendURL={backendURL} userID={userID} />}
            />
          </Routes>
        </div>

        {isModalOpen && (
          <WagerModal
            contracts={contractAddresses}
            walletAddress={walletAddress} // Pass walletAddress here
            onSave={handleSaveModal}
            onCancel={handleCancelModal}
          />
        )}

        {/* Display the toast if there is a message */}
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      </div>
    </Router>
  );
}

export default App;
