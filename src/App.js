import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WalletDetails from './components/WalletDetails/WalletDetails';
import NavBar from './components/NavBar/NavBar';
import WagerModal from './components/WagerModal/WagerModal';
import Toast from './components/Toast/Toast';
import SockJS from 'sockjs-client'; // Add this import
import './App.css';

// Use the correct URL with bypass header
const wsURL = 'https://flat-donkeys-laugh.loca.lt/ws';

function App() {
  const [userID, setUserID] = useState('');
  const [username, setUsername] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const ws = useRef(null);
  const contractAddresses = [
    { address: '0xA77241231a899b69725F2e2e092cf666286Ced7E', name: 'ShibWare', symbol: 'ShibWare', decimals: 18 },
    { address: '0x43AB6e79a0ee99e6cF4eF9e70b4C0c2DF5A4d0Fb', name: 'CRYPTIQ', symbol: 'CTQ', decimals: 18 },
  ];

  useEffect(() => {
    setUserID('5199577425');
    setUsername('poemcryptoman');

    // Initialize the SockJS connection
    ws.current = new SockJS(wsURL, null, {
      headers: {
        'bypass-tunnel-reminder': 'custom-value', // Use this header to bypass the Localtunnel reminder page
      },
    });

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current.send(JSON.stringify({
        type: 'initialize_user',
        userID: '5199577425',
        username: 'poemcryptoman',
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'rooms':
          setRooms(data.rooms);
          break;
        case 'game_status':
          setGameStatus(data.gameStatus);
          break;
        case 'wallet_address':
          setWalletAddress(data.wallet_address);
          break;
        case 'error':
          setToastMessage(data.message);
          setToastVisible(true);
          break;
        default:
          console.log('Received unhandled message:', data);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setToastMessage('WebSocket connection error. Please try again.');
      setToastVisible(true);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveGame();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [selectedRoom]);

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const createRoom = (contractAddress, wagerAmount) => {
    ws.current.send(JSON.stringify({
      type: 'create_room',
      userID,
      username,
      contractAddress,
      wagerAmount,
    }));
  };

  const joinRoom = (roomId) => {
    ws.current.send(JSON.stringify({
      type: 'join_room',
      userID,
      username,
      room_id: roomId,
      walletAddress,
    }));
  };

  const handleChoice = (choice) => {
    setUserChoice(choice);

    ws.current.send(JSON.stringify({
      type: 'make_choice',
      userID,
      username,
      room_id: selectedRoom,
      choice,
    }));
  };

  const leaveGame = () => {
    if (selectedRoom) {
      ws.current.send(JSON.stringify({
        type: 'leave_room',
        userID,
        username,
        room_id: selectedRoom,
      }));

      setSelectedRoom(null);
      setGameStatus(null);
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
        setToastVisible(true);
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
                    <button className="pixel-button refresh-button" onClick={() => ws.current.send(JSON.stringify({ type: 'list_rooms' }))}>
                      ↻
                    </button>
                  </div>
                  <div className="room-list">
                    {Object.values(rooms).map((room) => {
                      const contract = contractAddresses.find(
                        (c) => c.address === room.contract_address,
                      );
                      const decimals = contract ? contract.decimals : 1;
                      const formattedWagerAmount = room.wager_amount
                        ? (parseFloat(room.wager_amount) / Math.pow(10, decimals)).toFixed(3)
                        : 'N/A';

                      return (
                        <div className="room-card" key={room.room_id}>
                          <div className="room-details">
                            <p>Room ID: {room.room_id} | {room.status === 'waiting'
                              ? `Player: ${room.player1_username}`
                              : `${room.player1_username} vs ${room.player2_username}`}
                            </p>
                            <p>
                              Wager: {contract ? `(${contract.symbol})` : 'N/A'} | {formattedWagerAmount}
                            </p>
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
              element={<WalletDetails walletAddress={walletAddress} backendURL={wsURL} userID={userID} />}
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
