import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import WalletDetails from './components/WalletDetails/WalletDetails';
import NavBar from './components/NavBar/NavBar';
import WagerModal from './components/WagerModal/WagerModal';
import Toast from './components/Toast/Toast';
import Stats from './components/Stats/Stats';
import './App.css';
import AdBanner from './components/AdBanner/AdBanner';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

// Define the backend WebSocket URL
const backendURL = 'wss://e5557cf5a6e09b1644a02b95dccb6c00.serveo.net/ws';


function App() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const [allRooms, setAllRooms] = useState([]); // Store all rooms fetched from the backend
  const [filteredRooms, setFilteredRooms] = useState([]); // Store filtered rooms based on selected contract
  const [selectedContract, setSelectedContract] = useState('');  const [isUserInitialized, setIsUserInitialized] = useState(false); 
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
  const [boneBalance, setBoneBalance] = useState(0);
  const [countdown, setCountdown] = useState(20);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [ads, setAds] = useState([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const websocketRef = useRef(null);
  const countdownInterval = useRef(null);
  const messageQueue = useRef([]); 

  const contractAddresses = [
    // { address: '', name: 'Bones', symbol: 'BONES', decimals: 18, type: 'native' },
    { address: '0xA77241231a899b69725F2e2e092cf666286Ced7E', name: 'ShibWare', symbol: 'ShibWare', decimals: 18, type: 'erc20' },
    { address: '0x2761723006d3Eb0d90B19B75654DbE543dcd974f', name: 'ChewySwap', symbol: 'CHEWY', decimals: 18, type: 'erc20' },
    { address: '0x5212B42ef96A47Af93F3a6c801227b650EDEb12f', name: 'Sideshow 404', symbol: 'SKULLZ', decimals: 18, type: 'erc20' },
    { address: '0x8cC82045E761329FA13C9b0A0a31d76615fEc109', name: 'CorruptFun', symbol: 'CFUN', decimals: 18, type: 'erc20' },

  ];

  


  useEffect(() => {
    console.log('Contract Addresses:', contractAddresses);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      const fetchBoneBalance = async () => {
        try {
          const response = await fetch(`https://www.shibariumscan.io/api/v2/addresses/${walletAddress}`);
          const data = await response.json();
          const balance = parseFloat(data.coin_balance) / Math.pow(10, 18); // Adjust for decimals
          setBoneBalance(balance);
        } catch (error) {
          console.error('Error fetching BONE balance:', error);
        }
      };
  
      fetchBoneBalance();
    }
  }, [walletAddress]);




  useEffect(() => {
    // const retrievedUsername = "poemcryptoman";
    // const retrievedUserID = "5199577425";
    const retrievedUsername = initData.user.username || "Unknown Username";
    const retrievedUserID = initData.user.id || "Unknown UserID";
    // console.log('Setting userID:', retrievedUserID);
    setUserID(retrievedUserID);
    setUsername(retrievedUsername);
    
  }, []); // This effect runs only once, when the component mounts
  
  useEffect(() => {
    if (userID) {
      // Only establish a new WebSocket connection if it isn't already open or connecting
      if (!websocketRef.current || websocketRef.current.readyState > WebSocket.OPEN) {
        console.log('Establishing WebSocket connection');
        websocketRef.current = new WebSocket(backendURL);

        websocketRef.current.onopen = () => {
          console.log('WebSocket connection established');
          // Process queued messages
          while (messageQueue.current.length > 0) {
            const message = messageQueue.current.shift();
            sendMessage(message);
          }
          // Send initialization messages
          initializeUser(userID, username);
          fetchRooms();
          fetchUsers();
          fetchAds();
        };

        websocketRef.current.onmessage = (event) => {
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
    }
  }, [userID]);

  useEffect(() => {
    // Automatically fetch users when the app loads
    fetchUsers();
  }, []);

  useEffect(() => {
    // Fetch the initial data when the stats page is loaded for the first time
    if (view === 'history') {
      fetchGameStats();
    } else if (view === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [view, userID]);

 
  

  // Listening to game status updates when players join or make a move
  useEffect(() => {
    if (selectedRoom) {
      // console.log("game status")
      // console.log(selectedRoom)
      const interval = setInterval(() => {
        if (selectedRoom) { // Check if selectedRoom still exists before polling
          fetchGameStatus(selectedRoom);
        } else {
          clearInterval(interval); // Stop polling if selectedRoom becomes invalid
        }
      }, 1000); // Polling every 1 second
  
      return () => clearInterval(interval); // Clean up interval on component unmount
    }
  }, [selectedRoom]);
  
  useEffect(() => {
    const fetchTokenBalances = async () => {
      try {
        const response = await fetch(`https://www.shibariumscan.io/api/v2/addresses/${walletAddress}/token-balances`);
        const data = await response.json();
        setTokenBalances(data); // Store the token balances in state
      } catch (error) {
        console.error('Error fetching token balances:', error);
      }
    };
  
    if (walletAddress) {
      fetchTokenBalances();
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchRooms();

    const intervalId = setInterval(() => {
      fetchRooms();
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

const fetchGameStatus = (roomId) => {
  sendMessage({ type: 'GAME_STATUS', roomId });
};

useEffect(() => {
  const interval = setInterval(() => {
    if (gameStatus?.tryAgain2 === "yes") {
      console.log("here???")
      setUserChoice(''); // Clear the user's previous choice if the game is reset
      
      // Update gameStatus properly using setGameStatus
      setGameStatus((prevStatus) => ({
        ...prevStatus,
        TryAgain2: "", // Reset the tryAgain flag correctly
      }));
    }
  }, 1000); // Run every 1 second

  // Cleanup the interval when the component unmounts
  return () => clearInterval(interval);
}, [gameStatus, setGameStatus]);




useEffect(() => {
  if (gameStatus?.status === 'waiting' || gameStatus?.status === 'in_progress') {
    // Reset and start the countdown timer
    setCountdown(20);
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    countdownInterval.current = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) {
          return prevCountdown - 1;
        } else {
          clearInterval(countdownInterval.current);
          return 0;
        }
      });
    }, 1000);
  } else {
    clearInterval(countdownInterval.current);
  }
}, [gameStatus]);

const filterRooms = (rooms) => {
  if (selectedContract) {
    return rooms.filter((room) => room.contract_address === selectedContract);
  }
  return rooms;
};

useEffect(() => {
  const filtered = selectedContract
    ? allRooms.filter((room) => room.contract_address === selectedContract)
    : allRooms;
  setFilteredRooms(filtered);
}, [allRooms, selectedContract]);

// Handle changes in the filter dropdown
const handleContractChange = (event) => {
  setSelectedContract(event.target.value);
};


const renderGameStatusMessage = () => {
  if (!gameStatus) return null;

  // Convert IDs to strings for consistent comparison
  const currentUserID = userID.toString().trim();
  const player1ID = gameStatus.player1ID?.toString().trim();
  const player2ID = gameStatus.player2ID?.toString().trim();

  // Handle "waiting" status
  if (gameStatus.status === 'waiting') {
    if (currentUserID === player1ID && !gameStatus.player1Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    }
    return 'Waiting for opponent...';
  }

  // Handle "in_progress" status
  else if (gameStatus.status === 'in_progress') {
    if (currentUserID === player1ID && !gameStatus.player1Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    } else if (currentUserID === player2ID && !gameStatus.player2Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    }
    return 'Waiting for the game result...';
  }

  // Handle "completed" status
  else if (gameStatus.status === 'completed') {
    const player1Choice = gameStatus.player1Choice || 'None';
    const player2Choice = gameStatus.player2Choice || 'None';

    // Display message for a draw
    if (gameStatus.result === '') {
      return (
        <>
          <p>It's a Draw! Both players chose {player1Choice}.</p>
          {username === gameStatus.player1Username && (
            <button className="return-button" onClick={handleTryAgain}>
              Try Again
            </button>
          )}
        </>
      );
    } 

    // Display message for a win/loss, including player choices
    else {
      return (
        <>
          <p>{gameStatus.result?.split('! ')[1]}</p>
          <h2>{gameStatus.result?.includes(username) ? 'You Win!' : 'You Lose...'}</h2>
          <p>
            {gameStatus.player1Username} chose {player1Choice}.<br />
            {gameStatus.player2Username} chose {player2Choice}.
          </p>
          {/* Optionally include the Try Again button */}
          {/* {username === gameStatus.player1Username && (
            <button className="return-button" onClick={handleTryAgain}>
              Try Again
            </button>
          )} */}
        </>
      );
    }
  }

  return null;
};




useEffect(() => {
  // console.log("Updated game status state:", gameStatus);
}, [gameStatus]);


useEffect(() => {
  const rotationInterval = setInterval(() => {
    setCurrentAdIndex((prevIndex) => (prevIndex + 1) % ads.length);
  }, 10000); // Change ad every 10 seconds

  return () => clearInterval(rotationInterval);
}, [ads.length]);


  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const handleWebSocketMessage = (message) => {
    // console.log('Received WebSocket message:', message);

    switch (message.type) {
      case 'ADS_LIST':
        console.log(message)
        setAds(message.ads); // Update ads from WebSocket response
        break;
  
      case 'KICKOUT':
        // console.log(message.room_id)
        // console.log(selectedRoom)

          setToastMessage(message.message);
          setSelectedRoom('');
          setGameStatus('');
          setUserChoice('');
        
        break;
      

      case 'USERS_LIST': // Handle the users list response
      console.log('Setting users:', message.users);
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
    // Reset game status and user choice
    setGameStatus({
      ...gameStatus,
      status: 'in_progress',
      player1Choice: '',
      player2Choice: '',
    });
    setUserChoice(''); // Clear the user's previous choice
    console.log(gameStatus)
    setToastMessage('Game has been reset.');
    setToastVisible(true);
  } else {
    setToastMessage('Failed to reset the game.');
    setToastVisible(true);
  }
  break;
      case 'LEAVE_ROOM':
        console.log('Left room:', message.room_id);
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
          
          // Ensure message.rooms is not null or undefined
          if (!message.rooms) {
            setRooms([]);
            setAllRooms([]); 
            console.error('Rooms data is null or undefined.');
            return;
          }
        
          // Store all rooms in state (for filtering purposes)
          setAllRooms(message.rooms);
        
          // Filter the rooms based on the selected contract
          const filteredRooms = filterRooms(message.rooms);
          setRooms(filteredRooms);
        
          // Log the current userID for debugging
          console.log('Current userID:', userID);
        
          // Convert userID to a string for consistent comparison
          const currentUserID = userID.toString().trim();
        
          // Check if there's an active room where the user is player1 and the status is 'waiting'
          const activeRoom = filteredRooms.find(
            (room) => room.player1_id?.toString().trim() === currentUserID && room.status === 'waiting'
          );
        
          console.log('Active room found:', activeRoom); // Log the active room if found
        
          if (activeRoom) {
            // Automatically join the room if found
            console.log('Automatically joining room with ID:', activeRoom.room_id);
        
            setSelectedRoom(activeRoom.room_id);
            setGameStatus({
              roomId: activeRoom.room_id,
              player1ID: activeRoom.player1_id?.toString().trim(),
              player1Username: activeRoom.player1_username,
              player1Choice: activeRoom.player1_choice,
              player2ID: activeRoom.player2_id?.toString().trim(),
              player2Username: activeRoom.player2_username,
              player2Choice: activeRoom.player2_choice,
              status: activeRoom.status,
              contractAddress: activeRoom.contract_address,
              wagerAmount: activeRoom.wager_amount,
              result: activeRoom.result,
            });
        
            // Determine the correct choice based on whether the current user is player1 or player2
            if (currentUserID === activeRoom.player1_id?.toString().trim()) {
              setUserChoice(activeRoom.player1_choice);
            } else if (currentUserID === activeRoom.player2_id?.toString().trim()) {
              setUserChoice(activeRoom.player2_choice);
            }
          } else {
            console.log('No active room found for this user.');
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
        setIsUserInitialized(true); // Mark the user as initialized
        setWalletAddress(message.walletAddress);
        break;
        case 'JOIN_ROOM':
          if (message.error) {
            setToastMessage(message.error);
            setToastVisible(true);
          } else {
            console.log(message)
            setSelectedRoom(message.room_id);
            setGameStatus({
              player1ID: message.player1ID,
              player1Choice: message.player1Choice,
              player2ID: message.player2ID,
              player2Choice: message.player2Choice,
              status: message.status, // Make sure to pass the correct status here
            });
          }
          break;
      default:
        console.log('Unknown message type received:', message.type);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      console.log('selectedRoom updated:', selectedRoom);
    }
  }, [selectedRoom]);

  const fetchAds = () => {
    sendMessage({ type: 'FETCH_ADS' });
  };

  const sendMessage = (message) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify(message));
    } else {
      console.log('WebSocket is not open. Queuing message:', message);
      messageQueue.current.push(message); // Queue the message if WebSocket is not open
    }
  };

  const fetchRooms = () => {
    sendMessage({ type: 'FETCH_ROOMS' });
  };

  const refreshWebSocketConnection = () => {
    // Close the existing WebSocket connection if it's open
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
    }
  
    // Re-establish the WebSocket connection
    websocketRef.current = new WebSocket(backendURL);
  
    websocketRef.current.onopen = () => {
      console.log('WebSocket connection re-established');
      // Process queued messages
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        sendMessage(message);
      }
      // Send initialization messages
      initializeUser(userID, username);
      // Fetch rooms after re-establishing the WebSocket connection
      fetchRooms();
    };
  
    websocketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      handleWebSocketMessage(message);
    };
  
    websocketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  
    websocketRef.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
    };
  };
  

  const initializeUser = (userID, username) => {
  
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
    const roomToJoin = rooms.find((room) => room.room_id === roomId);
    if (!roomToJoin) {
      setToastMessage('Room not found.');
      setToastVisible(true);
      return;
    }
  
    const contract = contractAddresses.find(
      (contract) => contract.address === roomToJoin.contract_address
    );
  
    if (!contract) {
      setToastMessage('Contract not found.');
      setToastVisible(true);
      return;
    }
  
    // Calculate required tokens for the wager
    const requiredTokens = parseFloat(roomToJoin.wager_amount) / Math.pow(10, contract.decimals);
  
    // Get the user's token balance (this function should be implemented based on how you fetch token balances)
    const userTokenBalance = getUserTokenBalance(contract.address); // This should be implemented
  
    // Check BONE balance first
    if (boneBalance < 1) {
      setToastMessage('You need at least 1 BONE to join the room.');
      setToastVisible(true);
      return;
    }
  
    // Check if the user has enough of the wager token
    if (userTokenBalance < requiredTokens) {
      setToastMessage(`You need at least ${requiredTokens.toFixed(3)} ${contract.symbol} to join this room.`);
      setToastVisible(true);
      return;
    }
  
    // Proceed to send the message if all conditions are met
    sendMessage({
      type: 'JOIN_ROOM',
      userID: userID.toString(),
      username,
      roomId,
      walletAddress,
    });
  };
  
  // Implement this function to get the user's token balance
  const getUserTokenBalance = (contractAddress) => {
    const tokenData = tokenBalances.find(token => token.token.address === contractAddress);
    if (!tokenData) return 0;
    return parseFloat(tokenData.value) / Math.pow(10, contractAddresses.find(c => c.address === contractAddress).decimals);
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
      setSelectedRoom('');
      setGameStatus('');
      setUserChoice('');
      sendMessage({
        type: 'LEAVE_ROOM',
        userID: userID.toString(),
        username,
        roomId: selectedRoom,
      });
    }
  };

  const handleOpenModal = () => {
    if (boneBalance < 1) {
      setToastMessage(`You need at least 1 BONE to create a room. You currently have ${boneBalance.toFixed(3)} BONE.`);
      setToastVisible(true);
      return; // Prevent further execution
    }
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
  if (!isUserInitialized) {
    return (
      <div className="loading-screen">
        <h1 className="loading-message">
          Game<br />
          Loading...
        </h1>
      </div>
    );
  }
  
  

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
                ? `${gameStatus.player1Username}${
                    gameStatus.player1Choice ? '[✔️]' : '[❓]'
                  }`
                : '[Pending]'}
              {' vs '}
              {gameStatus.player2Username
                ? `${gameStatus.player2Username}${
                    gameStatus.player2Choice ? '[✔️]' : '[❓]'
                  }`
                : '[Pending]'}
            </h2>
  
            <div className="game-status-message">{renderGameStatusMessage()}</div>
  
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
  


              </>
            )}
  
            <button className="return-button" onClick={leaveGame}>
              Return to Lobby
            </button>
  
            {gameStatus.status === 'completed' && (
              <div>
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
                  <h1 className="welcome-message">Welcome {username}</h1>
                  <p>
                    <b>Wallet: </b>
                    <WalletDisplay walletAddress={walletAddress} />
                  </p>
                  <div className="header-row">
  <div className="left-section">
    <button className="pixel-button create-button" onClick={handleOpenModal}>
      Create Room
    </button>
    <button className="pixel-button refresh-button" onClick={refreshWebSocketConnection}>
      ↻
    </button>
  </div>
  <div className="right-section">
    <select
      className="filter-dropdown"
      value={selectedContract}
      onChange={handleContractChange}
    >
      <option value="">All Tokens</option>
      {contractAddresses.map((contract) => (
        <option key={contract.address} value={contract.address}>
          {contract.symbol}
        </option>
      ))}
    </select>
  </div>
</div>

                  <div className="room-list">
                  {filteredRooms.map((room) => {
                      const contract = contractAddresses.find((c) => c.address === room.contract_address);
                      const decimals = contract ? contract.decimals : 1;
                      const formattedWagerAmount = room.wager_amount
                        ? (parseFloat(room.wager_amount) / Math.pow(10, decimals)).toFixed(3)
                        : 'N/A';
  
                      return (
                        <div className="room-card" key={room.room_id}>
                          <div className="room-details">
                            <p>
                              {room.status === 'waiting'
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
              element={
                <WalletDetails
                  walletAddress={walletAddress}
                  backendURL={backendURL}
                  userID={userID}
                  sendMessage={sendMessage}
                  users={users}
                  contractAddresses={contractAddresses}
                />
              }
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
                  fetchGameStats={fetchGameStats}
                  fetchLeaderboard={fetchLeaderboard}
                />
              }
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
        <AdBanner ads={ads} />
      </div>
    </Router>
  );
  
}

export default App;

