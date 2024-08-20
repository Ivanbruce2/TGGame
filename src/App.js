import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WalletDetails from './components/WalletDetails/WalletDetails';
import NavBar from './components/NavBar/NavBar';
import WagerModal from './components/WagerModal/WagerModal';
import Toast from './components/Toast/Toast';
import Stats from './components/Stats/Stats';
import './App.css';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

// Define the backend WebSocket URL
const backendURL = 'ws://localhost:8080/ws';

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
  const [toastMessage, setToastMessage] = useState('');
  const [toastLink, setToastLink] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const websocketRef = useRef(null);

  const contractAddresses = [
    { address: '0xA77241231a899b69725F2e2e092cf666286Ced7E', name: 'ShibWare', symbol: 'ShibWare', decimals: 18 },
    { address: '0x43AB6e79a0ee99e6cF4eF9e70b4C0c2DF5A4d0Fb', name: 'CRYPTIQ', symbol: 'CTQ', decimals: 18 },
  ];

  useEffect(() => {
    const retrievedUsername = initData.user.username || "Unknown Username";
    const retrievedUserID = initData.user.id || "Unknown UserID";
    setUserID(retrievedUserID);
    setUsername(retrievedUsername);

    // Establish WebSocket connection only if it is not already established
    if (!websocketRef.current || websocketRef.current.readyState === WebSocket.CLOSED) {
      console.log('Establishing WebSocket connection');
      websocketRef.current = new WebSocket(backendURL);

      websocketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        initializeUser(retrievedUserID, retrievedUsername);
        fetchRooms();
      };

      websocketRef.current.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocketRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event);
      };
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Disabling cleanup for now
    // return () => {
    //   console.log('Cleaning up WebSocket connection');
    //   window.removeEventListener('beforeunload', handleBeforeUnload);

    //   // Only close the WebSocket if it's open or connecting
    //   if (
    //     websocketRef.current &&
    //     (websocketRef.current.readyState === WebSocket.OPEN ||
    //       websocketRef.current.readyState === WebSocket.CONNECTING)
    //   ) {
    //     console.log('Closing WebSocket connection');
    //     websocketRef.current.close();
    //   }
    // };
  }, []); 

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      
      case 'ROOMS_LIST':
        setRooms(message.rooms);
        break;
        case 'GAME_STATUS':
          setGameStatus(message.status);
          if (message.status === 'completed') {
            // Display the result or handle the completed game state
            console.log('Game completed:', message.result);
          }
          break;
        
      case 'TOKEN_TRANSFER':
        if (message.success) {
          setToastMessage('Game completed! Tokens have been transferred.');
          setToastLink(`https://shibariumscan.io/tx/${message.txHash}`);
          setToastVisible(true);
        } else {
          setToastMessage('Game completed!');
          setToastVisible(true);
        }
        break;
        case 'INITIALIZE_USER':  // New case for handling INITIALIZE_USER
        setUserID(message.userID);
        setUsername(message.username);
        setWalletAddress(message.walletAddress);
        console.log("User initialized:", message);
        break;
        case 'JOIN_ROOM':  // New case for handling JOIN_ROOM
        if (message.error) {
          // Handle any errors returned from the backend
          setToastMessage(message.error);
          setToastVisible(true);
        } else {
          // Successfully joined the room
          setSelectedRoom(message.room_id);
          setGameStatus('waiting');
          console.log("Joined room:", message.room_id);
        }
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  };

  const sendMessage = (message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    }
  };

  const fetchRooms = () => {
    sendMessage({ type: 'FETCH_ROOMS' });
  };

  const initializeUser = (userID, username) => {
    const userIDString = String(userID);
    console.log(userID,username)
    sendMessage({
      type: 'INITIALIZE_USER',
      userIDString,
      username,
    });
  };

  const createRoom = (contractAddress, wagerAmount) => {
    const userIDString = String(userID);
    sendMessage({
      type: 'CREATE_ROOM',
      userIDString,
      username,
      contractAddress,
      wagerAmount,
    });
  };

  const joinRoom = (roomId) => {
    // Log the parameters before sending them to the backend
    console.log('Joining room with the following details:');
    console.log('userID:', userID);
    console.log('username:', username);
    console.log('roomId:', roomId);
    console.log('walletAddress:', walletAddress);
  
    // Explicitly ensure that the userID is treated as a string to avoid scientific notation
    const userIDString = String(userID);
  
    // Log the userID after conversion to ensure it looks correct
    console.log('userID after conversion to string:', userIDString);
  
    sendMessage({
      type: 'JOIN_ROOM',
      userID: userIDString,
      username,
      roomId,
      walletAddress,
    });
  
    // Log after sending the message
    console.log('Message sent for joining room');
  };
  

  const handleChoice = (choice) => {
    setUserChoice(choice);
    sendMessage({
      type: 'MAKE_CHOICE',
      userID,
      username,
      roomId: selectedRoom,
      choice,
    });
  };

  const handleTryAgain = () => {
    sendMessage({
      type: 'TRY_AGAIN',
      roomId: selectedRoom,
      userID,
    });
  };

  const leaveGame = () => {
    if (selectedRoom) {
      sendMessage({
        type: 'LEAVE_ROOM',
        userID,
        username,
        roomId: selectedRoom,
      });
      setSelectedRoom('');
      setGameStatus('');
      setUserChoice('');
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleSaveModal = (contractAddress, wagerAmount) => {
    setIsModalOpen(false);
    createRoom(contractAddress, wagerAmount);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  const WalletDisplay = ({ walletAddress }) => {
    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setToastMessage('Wallet address copied to clipboard!');
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

  if (selectedRoom) {
    return (
      <div className="App">
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
                  <>
                    <p>It's a Draw! Both players chose {gameStatus.player1_choice}.</p>
                    {username === gameStatus.player1_username && (
                      <button className="try-again-button" onClick={handleTryAgain}>
                        Try Again
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>{gameStatus.result?.split('! ')[1]}</p>
                    <h2>{gameStatus.result?.includes(username) ? 'You Win!' : 'You Lose...'}</h2>
                    {username === gameStatus.player1_username && (
                      <button className="try-again-button" onClick={handleTryAgain}>
                        Try Again
                      </button>
                    )}
                  </>
                )}
                {toastMessage && (
                  <Toast
                    message={toastMessage}
                    link={toastLink}
                    onClose={() => {
                      setToastMessage('');
                      setToastLink('');
                    }}
                  />
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
      </div>
    );
  }

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
                      const contract = contractAddresses.find(c => c.address === room.contract_address);
                      const decimals = contract ? contract.decimals : 1;
                      const formattedWagerAmount = room.wager_amount
                        ? (parseFloat(room.wager_amount) / Math.pow(10, decimals)).toFixed(3)
                        : 'N/A';

                      return (
                        <div className="room-card" key={room.room_id}>
                          <div className="room-details">
                            <p>
                              Room ID: {room.room_id} | {room.status === 'waiting'
                                ? `Player: ${room.player1_username}`
                                : `${room.player1_username} vs ${room.player2_username}`}
                            </p>
                            <p>Wager: {contract ? `(${contract.symbol})` : 'N/A'} | {formattedWagerAmount}</p>
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
            <Route path="/stats" element={<Stats userID={userID} backendURL={backendURL} contractAddresses={contractAddresses} />} />
          </Routes>
        </div>

        {isModalOpen && (
          <WagerModal
            contracts={contractAddresses}
            walletAddress={walletAddress}
            onSave={handleSaveModal}
            onCancel={handleCancelModal}
          />
        )}

        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage('')} />}
      </div>
    </Router>
  );
}

export default App;
