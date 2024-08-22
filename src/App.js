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
const backendURL = 'wss://73cc6442b8341507b161c8de991df0ed.serveo.net/ws';


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
  const [overallStats, setOverallStats] = useState(null);
  const [gameLogs, setGameLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [view, setView] = useState('history');
  const [users, setUsers] = useState([]); // New state to store users

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
        fetchRooms(); // Fetch rooms and check if the user is already in a game
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
  
    return () => {
      console.log('Cleaning up WebSocket connection');
      window.removeEventListener('beforeunload', handleBeforeUnload);
  
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        websocketRef.current.close();
      }
    };
  }, []);
  

  // Listening to game status updates when players join or make a move
useEffect(() => {
  if (selectedRoom) {
    const interval = setInterval(() => {
      fetchGameStatus(selectedRoom);
    }, 2000); // Polling every 2 seconds

    return () => clearInterval(interval);
  }
}, [selectedRoom]);

const fetchGameStatus = (roomId) => {
  sendMessage({
    type: 'GAME_STATUS',
    roomId,
  });
};

useEffect(() => {
  console.log("Updated game status state:", gameStatus);
}, [gameStatus]);


  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const handleWebSocketMessage = (message) => {
    console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'USERS_LIST': // Handle the users list response
      setUsers(message.users);
      break;
   
      case 'GAME_STATS':
        setOverallStats(message.overallStats);
        setGameLogs(message.gameLogs);
        break;
      case 'LEADERBOARD':
        setLeaderboard(message.leaderboard);
        break;
        case 'TRANSFER_SUCCESS':
          setToastMessage(
            <span>
              Transaction completed successfully!{' '}
              <a href={`https://shibariumscan.io/tx/${message.txHash}`} target="_blank" rel="noopener noreferrer">
                View Transaction
              </a>
            </span>
          );
          setToastVisible(true);
          break;
        
      case 'TRY_AGAIN':
        console.log(message);
        if (message.success) {
          setGameStatus('waiting');
          setUserChoice('');
          setToastMessage('Game has been reset. Waiting for a new player...');
          setToastVisible(true);
        } else {
          setToastMessage('Failed to reset the game.');
          setToastVisible(true);
        }
        break;
      case 'LEAVE_ROOM':
        console.log('Left room:', message.roomId);
        setSelectedRoom('');
        setGameStatus('');
        setUserChoice('');
        setToastMessage(message.message);
        setToastVisible(true);
        break;
      case 'CREATE_ROOM':
        console.log('Room created with ID:', message.room_id);
        setSelectedRoom(message.room_id);
        break;
      case 'ROOMS_LIST':
        setRooms(message.rooms);
        const activeRoom = message.rooms.find(
          (room) =>
            room.player1ID === userID && room.status === 'waiting'
        );
  
        if (activeRoom) {
          // Automatically join the room if found
          setSelectedRoom(activeRoom.room_id);
          setGameStatus({
            roomId: activeRoom.room_id,
            player1ID: activeRoom.player1ID,
            player1Username: activeRoom.player1Username,
            player1Choice: activeRoom.player1Choice,
            player2ID: activeRoom.player2ID,
            player2Username: activeRoom.player2Username,
            player2Choice: activeRoom.player2Choice,
            status: activeRoom.status,
            contractAddress: activeRoom.contract_address,
            wagerAmount: activeRoom.wager_amount,
            result: activeRoom.result,
          });
        }
        break;
      case 'GAME_STATUS':
        console.log('Updating game status:', message);
        setGameStatus({
          roomId: message.roomId,
          player1ID: message.player1ID,
          player1Username: message.player1Username,
          player1Choice: message.player1Choice,
          player2ID: message.player2ID,
          player2Username: message.player2Username,
          player2Choice: message.player2Choice,
          status: message.status,
          contractAddress: message.contractAddress,
          wagerAmount: message.wagerAmount,
          result: message.result,
        });
        if (message.status === 'completed' && message.result) {
          triggerTransfer(message.roomId);
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
      case 'INITIALIZE_USER':
        setUserID(message.userID);
        setUsername(message.username);
        setWalletAddress(message.walletAddress);
        break;
      case 'JOIN_ROOM':
        if (message.error) {
          setToastMessage(message.error);
          setToastVisible(true);
        } else {
          setSelectedRoom(message.room_id);
          setGameStatus({
            player1ID: message.player1ID,
            player1Choice: message.player1Choice,
            player2ID: message.player2ID,
            player2Choice: message.player2Choice,
            status: 'waiting',
          });
        }
        break;
      default:
        console.log('Unknown message type received:', message.type);
    }
  };

  const sendMessage = (message) => {
    console.log('Sending WebSocket message:', message);
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.log('WebSocket is not open. Cannot send message:', message);
    }
  };

  const fetchRooms = () => {
    sendMessage({ type: 'FETCH_ROOMS' });
  };

  const initializeUser = (userID, username) => {
    console.log(userID, username);
    sendMessage({
      type: 'INITIALIZE_USER',
      userID: userID.toString(), // Convert userID to string before sending
      username,
    });
  };
  

  const fetchGameStats = () => {
    sendMessage({
      type: 'GAME_STATS',
      userID: userID.toString(),
    });
  };

  const fetchLeaderboard = () => {
    sendMessage({ type: 'LEADERBOARD' });
  };

  useEffect(() => {
    if (view === 'history') {
      fetchGameStats();
    } else if (view === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [view, userID]);

  const createRoom = (contractAddress, wagerAmount) => {
    sendMessage({
      type: 'CREATE_ROOM',
      userID: userID.toString(),
      username,
      contractAddress,
      wagerAmount,
    });
  };

  const joinRoom = (roomId) => {
    sendMessage({
      type: 'JOIN_ROOM',
      userID: userID.toString(),
      username,
      roomId,
      walletAddress,
    });
  };

  const handleChoice = (choice) => {
    setUserChoice(choice);
    sendMessage({
      type: 'MAKE_CHOICE',
      userID: userID.toString(),
      username,
      roomId: selectedRoom,
      choice,
    });
    
    
  };

  const triggerTransfer = (roomId) => {
    sendMessage({ type: 'TRIGGER_TRANSFER', roomId });
  };

  const handleTryAgain = () => {
    sendMessage({
      type: 'TRY_AGAIN',
      roomId: selectedRoom,
      userID: userID.toString(),
    });
  };

  const leaveGame = () => {
    if (selectedRoom) {
      sendMessage({
        type: 'LEAVE_ROOM',
        userID: userID.toString(),
        username,
        roomId: selectedRoom,
      });
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

  const fetchUsers = () => {
    sendMessage({ type: 'FETCH_USERS' });
  };

  const WalletDisplay = ({ walletAddress }) => {
    const truncatedAddress = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;

    const copyToClipboard = () => {
      navigator.clipboard.writeText(walletAddress).then(() => {
        setToastMessage('Wallet address copied to clipboard!');
      }, (err) => {
        console.error('Failed to copy text:', err);
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
    // Extract the relevant contract information based on the stored contract address
    const contract = contractAddresses.find(
      (c) => c.address === gameStatus?.contractAddress
    );
    const contractSymbol = contract?.symbol || 'Unknown Symbol';
    const decimals = contract?.decimals || 1;
    const formattedWagerAmount = gameStatus?.wagerAmount
      ? (parseFloat(gameStatus.wagerAmount) / Math.pow(10, decimals)).toFixed(3)
      : 'N/A';
  
    return (
      <div className="App">
        <h1 className="welcome-message2">Room {selectedRoom}</h1>
  
        {/* Display the wager contract and amount immediately below the room information */}
        <div className="wager-info">
          <p>
            [{contractSymbol}: {formattedWagerAmount}]
          </p>
        </div>
  
        {gameStatus ? (
          <>
<h2 className="game-status">
  {gameStatus.player1Username
    ? `${gameStatus.player1Username} ${
        gameStatus.player1Choice ? (
         ' [✔️]'
        ) : (
          '[❓]'
        )
      }`
    : '[Pending]'}
  {' vs '}
  {gameStatus.player2Username
    ? `${gameStatus.player2Username} ${
        gameStatus.player2Choice ? (
          '[✔️]'
        ) : (
          '[❓]'
        )
      }`
    : '[Pending]'}
</h2>


  
            {gameStatus.status !== 'completed' && (
              <>
<div className="choices">
  {['Scissors', 'Paper', 'Stone'].map((choice) => (
    <button
      key={choice}
      className={`choice-button ${userChoice === choice ? 'selected' : ''}`}
      onClick={() => handleChoice(choice)}
      disabled={!!userChoice} // Disable buttons after a choice is made
    >
      {choice}
    </button>
  ))}
</div>

                <div className="wager-info"><p>Waiting for opponent...</p></div>
                
              </>
            )}
  
            <button className="return-button" onClick={leaveGame}>
              Return to Lobby
            </button>
  
            {gameStatus.status === 'completed' && (
              <div>
                {!gameStatus.result ? (
                  <>
                    <p>It's a Draw! Both players chose {gameStatus.player1Choice}.</p>
                    {username === gameStatus.player1Username && (
                      <button className="try-again-button" onClick={handleTryAgain}>
                        Try Again
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>{gameStatus.result === username ? `You Win!` : `You Lose...`}</p>
                    {username === gameStatus.player1Username && (
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
              {['Scissors', 'Paper', 'Stone'].map((choice) => (
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
              element={<WalletDetails walletAddress={walletAddress} backendURL={backendURL} userID={userID} sendMessage={sendMessage} users={users} />}
            />
            <Route
              path="/stats"
              element={
                <Stats
                  userID={userID}
                  backendURL={backendURL}
                  contractAddresses={contractAddresses}
                  overallStats={overallStats}
                  gameLogs={gameLogs}
                  leaderboard={leaderboard}
                  view={view}
                  setView={setView}
                />}
            />
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
