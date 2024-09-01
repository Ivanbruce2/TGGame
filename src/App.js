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
const backendURL = process.env.REACT_APP_BACKEND_URL;


function App() {
  const { initDataRaw, initData } = retrieveLaunchParams();
  const [hasCheckedActiveRoom, setHasCheckedActiveRoom] = useState(false);
  const [isSessionTerminated, setIsSessionTerminated] = useState(false);
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
  const pingIntervalRef = useRef(null);
  const [contractAddresses, setContractAddresses] = useState([]);
  const [currentView, setCurrentView] = useState('lobby'); // 'lobby', 'game', etc.
const [activeRoomId, setActiveRoomId] = useState(null);
const [roomStatuses, setRoomStatuses] = useState({});
const [gameStatuses, setGameStatuses] = useState({});



  const allowedUserIDs = ['6937856159', '5199577425'];


  


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
    console.log("selectedRoom changed:", selectedRoom);
}, [selectedRoom]);

useEffect(() => {
  console.log("Component mounted or re-rendered");

  return () => {
      console.log("Component unmounted");
  };
}, []); // An empty dependency array runs the effect only on mount and unmount.


useEffect(() => {
  console.log("Component re-rendered due to selectedRoom change:", selectedRoom);
}, [selectedRoom]);


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
          fetchContract();
          fetchRooms();
          fetchUsers();
          fetchAds();
          
          // checkForActiveRoomOnConnect();
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

  const sendPing = () => {
    if (websocketRef.current) {
      console.log('WebSocket state:', websocketRef.current.readyState);
      if (websocketRef.current.readyState === WebSocket.OPEN) {
        console.log('Sending ping to server');
        websocketRef.current.send(JSON.stringify({ type: 'PING' }));
      } else {
        console.log('WebSocket is not open; ping not sent');
      }
    } else {
      console.log('WebSocket reference is null');
    }
  };
  
  
  

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
  // useEffect(() => {
  //   if (selectedRoom) {
  //     // console.log("game status")
  //     // console.log(selectedRoom)
  //     const interval = setInterval(() => {
  //       if (selectedRoom) { // Check if selectedRoom still exists before polling
  //         fetchGameStatus(selectedRoom);
  //       } else {
  //         clearInterval(interval); // Stop polling if selectedRoom becomes invalid
  //       }
  //     }, 1000); // Polling every 1 second
  
  //     return () => clearInterval(interval); // Clean up interval on component unmount
  //   }
  // }, [selectedRoom]);
  
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

  // useEffect(() => {
  //   fetchRooms();
  
  //   const intervalId = setInterval(() => {
  //     fetchRooms();
  //   }, 3000);
  
  //   return () => clearInterval(intervalId);
  // }, []);

  useEffect(() => {
  
    const intervalId = setInterval(() => {

      sendPing();
    }, 10000);
  
    return () => clearInterval(intervalId);
  }, []);
  
  const handleToastClose = () => {
    setToastVisible(false);  // Hide the toast
  };
  

const fetchGameStatus = (roomId) => {
  sendMessage({ type: 'GAME_STATUS', roomId });
};

useEffect(() => {
  const interval = setInterval(() => {

    if (gameStatus?.tryAgain2 === "yes") {
      
      setUserChoice(''); // Clear the user's previous choice if the game is reset
      
      // Update gameStatus properly using setGameStatus
     
    }
  }, 500); // Run every 1 second

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
  console.log('Rooms before filtering:', rooms);
  console.log('Selected contract:', selectedContract);

  if (selectedContract) {
    const filtered = rooms.filter((room) => room.contractAddress === selectedContract);
    console.log('Filtered rooms:', filtered);
    return filtered;
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

const reconnectWebSocket = () => {
  // Wait for 3 seconds before attempting to reconnect
  setTimeout(() => {
    console.log('Attempting to reconnect WebSocket...');
    websocketRef.current = new WebSocket(backendURL);

    websocketRef.current.onopen = () => {
      console.log('WebSocket connection re-established');
      // Process queued messages
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        sendMessage(message);
      }
      // Re-initialize the user and fetch necessary data
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
      reconnectWebSocket(); // Retry connection on error
    };

    websocketRef.current.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      if (!isSessionTerminated) {
        reconnectWebSocket(); // Retry connection on close
      }
    };
  }, 3000); // Reconnect after 3 seconds
};


const renderGameStatusMessage = (currentGameStatus) => {
  if (!currentGameStatus) return null;

  // Convert IDs to strings for consistent comparison
  const currentUserID = userID.toString().trim();
  const player1ID = currentGameStatus.player1ID?.toString().trim();
  const player2ID = currentGameStatus.player2ID?.toString().trim();

  // Handle "waiting" status
  if (currentGameStatus.status === 'waiting') {
    if (currentUserID === player1ID && !currentGameStatus.player1Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    }
    return 'Waiting for opponent...';
  }

  // Handle "in_progress" status
  else if (currentGameStatus.status === 'in_progress') {
    if (currentUserID === player1ID && !currentGameStatus.player1Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    } else if (currentUserID === player2ID && !currentGameStatus.player2Choice) {
      return `You have ${countdown} seconds to make your move or you will be kicked out.`;
    }
    return 'Waiting for the game result...';
  }

  // Handle "completed" status
  else if (currentGameStatus.status === 'completed') {
    const player1Choice = currentGameStatus.player1Choice || 'None';
    const player2Choice = currentGameStatus.player2Choice || 'None';

    // Display message for a draw
    if (currentGameStatus.result === '') {
      return (
        <>
          <p>It's a Draw! Both players chose {player1Choice}.</p>
          <div className="try-again-container">
            <button className="try-again-button" onClick={handleTryAgain}>
              Try Again
            </button>
          </div>
        </>
      );
    } 

    // Display message for a win/loss, including player choices
    else {
      return (
        <>
          <p>{currentGameStatus.result?.split('! ')[1]}</p>
          <h2>{currentGameStatus.result?.includes(username) ? 'You Win!' : 'You Lose...'}</h2>
          <p>
            {currentGameStatus.player1Username
              ? `${currentGameStatus.player1Username} chose ${player1Choice}.`
              : '[Player left]'}
            <br />
            {currentGameStatus.player2Username
              ? `${currentGameStatus.player2Username} chose ${player2Choice}.`
              : '[Player left]'}
          </p>
          <div className="try-again-container">
            <button className="try-again-button" onClick={handleTryAgain}>
              Try Again
            </button>
          </div>
        </>
      );
    }
  }

  return null;
};


useEffect(() => {
  console.log('gameStatuses updated:', gameStatuses);
}, [gameStatuses]);


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
      case 'ROOMS_LIST_UPDATE':
        handleRoomsList(message);
break;
      case 'SESSION_TERMINATED':
        console.log("session terminated...")
        // alert('Your session was terminated because you have opened the app elsewhere.');
        // You may want to reset the state or redirect the user to a specific page
        // setSelectedRoom(null);
        // setGameStatus(null);
        // setUserChoice('');
        setIsSessionTerminated(true);
        break;

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
              // Reset the game status for the specific room
              setGameStatuses((prevStatuses) => ({
                ...prevStatuses,
                [message.room_id]: {
                  ...prevStatuses[message.room_id],
                  status: 'in_progress',
                  player1Choice: '',
                  player2Choice: '',
                  result: '',  // Clear the result as well
                },
              }));
          
              setToastMessage('Game has been reset.');
              setToastVisible(true);
            } else {
              setToastMessage('Failed to reset the game.');
              setToastVisible(true);
            }
            break;
          
  case 'LEAVE_ROOM':
    console.log('Left room:', message.room_id);
  
    // Update the game statuses by removing the room that was exited
    setGameStatuses((prevStatuses) => {
      const updatedStatuses = { ...prevStatuses };
      delete updatedStatuses[message.room_id];
      return updatedStatuses;
    });
  
    // Clear the selected room and related states
    setActiveRoomId(null);
    setSelectedRoom(null);
    setUserChoice('');
    setToastMessage(message.message || 'You have left the room.');
    setToastVisible(true);
  
    // Navigate back to the lobby view
    setCurrentView('lobby');
    break;
  
        case 'CREATE_ROOM':
          console.log('Room created with ID:', message.room_id);
          console.log('Full message:', message);
          console.log('Wager Amount:', message.wagerAmount); // Check if this logs the expected value
          
          // Update the game status for the specific room
          setGameStatuses((prevStatuses) => ({
              ...prevStatuses,
              [message.room_id]: {
                  roomId: message.room_id,
                  player1ID: message.player1ID,
                  player1Username: message.player1Username,
                  player1Choice: message.player1Choice,
                  player2ID: message.player2ID,
                  player2Username: message.player2Username,
                  player2Choice: message.player2Choice,
                  status: message.status,
                  contractAddress: message.contractAddress,
                  wagerAmount: message.wagerAmount, // Ensure this line is correct
                  result: message.result,
              },
          }));
      
          // Set the currently active room ID if needed
          setActiveRoomId(message.room_id);
          setUserChoice('');
          setCurrentView('game');
          break;
      
        case 'ROOMS_LIST':
        handleRoomsList(message);    
        break;
      
        case 'GAME_STATUS':
          console.log('Updating game status:', message);
      
          if (message.status === "" || 
              (userID.toString() !== message.player1ID?.toString() && userID.toString() !== message.player2ID?.toString())) {
              
              // Reset the game status for this room if the game has ended or the user is not in the game
              setGameStatuses((prevStatuses) => {
                  const updatedStatuses = { ...prevStatuses };
                  delete updatedStatuses[message.room_id];
                  return updatedStatuses;
              });
      
              if (activeRoomId === message.room_id) {
                  setActiveRoomId(null);
                  setCurrentView('lobby');  // Send the user back to the lobby
              }
      
              console.log('User has been removed from the game or game has ended.');
          } else {
              // Update the game status as usual for the specific room
              setGameStatuses((prevStatuses) => ({
                  ...prevStatuses,
                  [message.room_id]: {
                      roomId: message.room_id,
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
                      tryAgain: message.tryAgain,
                      tryAgain2: message.tryAgain2,
                  },
              }));
      
              // Handle user choice display based on the player's ID
              if (activeRoomId === message.room_id) {
                  const currentGameStatus = {
                      player1Choice: message.player1Choice,
                      player2Choice: message.player2Choice,
                  };
                  const playerChoice = userID.toString() === message.player1ID.toString() ? currentGameStatus.player1Choice : currentGameStatus.player2Choice;
      
                  // You may display this choice in the UI if needed
                  console.log('Player Choice:', playerChoice);
              }
          }
          break;
            case 'FETCH_CONTRACT':
              console.log('Received contract addresses:', message.contractAddresses);
              setContractAddresses(message.contractAddresses); // Store the contract addresses in state
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
              console.log("Joined room");
              console.log(message);
      
              // Update the game status for the room
              setGameStatuses((prevStatuses) => ({
                  ...prevStatuses,
                  [message.room_id]: {
                      roomId: message.room_id,
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
                  },
              }));
      
              // Handle reconnection scenario
              if (message.reconnect === "yes") {
                  console.log("Reconnected to room");
                  setActiveRoomId(message.room_id);
                  setCurrentView('game');
                  setToastMessage('Reconnected to your room.');
                  setToastVisible(true);
                  return;
              }
      
              // If the user is Player 1 and someone else (Player 2) has joined
              if (userID.toString() === message.player1ID.toString() && message.player2ID) {
                  setToastMessage(`${message.player2Username} has joined your room.`);
                  setToastVisible(true);
              }
      
              // If the user is Player 2 and has successfully joined the room
              if (userID.toString() === message.player2ID.toString()) {
                  setToastMessage(`You have joined the room as Player 2.`);
                  setToastVisible(true);
                  setActiveRoomId(message.room_id);  // Set the active room ID
                  setCurrentView('game');  // Navigate to the game view
              }
      
              // Update user choice state based on their role in the game
              if (userID.toString() === message.player1ID.toString()) {
                  setUserChoice(message.player1Choice);
              } else if (userID.toString() === message.player2ID.toString()) {
                  setUserChoice(message.player2Choice);
              }
      
              // If the user is already in the room and currently viewing the game, navigate to it
              if (activeRoomId === message.room_id && currentView === 'game') {
                  setActiveRoomId(message.room_id);
                  setCurrentView('game');
              }
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

  useEffect(() => {
    if (selectedRoom === null) {
        console.log('selectedRoom was reset to null');
    }
}, [selectedRoom]);


  const fetchAds = () => {
    sendMessage({ type: 'FETCH_ADS' });
  };

  const fetchContract = () => {
    sendMessage({ type: 'FETCH_CONTRACT' });
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
      // Display the reason for closure
      if (event.reason) {
        console.log(`Connection closed: ${event.reason}`)
        // alert(`Connection closed: ${event.reason}`);
      } else {
        console.log("Connection closed by the server.")
        // alert("Connection closed by the server.");
      }
    };
  };
  
  const handleRoomsList = (message) => {
    console.log('handleRoomsList called');
    console.log('Received message:', message);
    console.log(selectedRoom);

    // Prevent updating the room list if the user is already in a game
    if (selectedRoom) {
        console.log('User is in a game. Not updating the room list.');
        return;
    }

    if (!message.rooms) {
        setRooms([]);
        setAllRooms([]);
        console.error('Rooms data is null or undefined.');
        return;
    }

    // Store all rooms in state (for filtering purposes)
    console.log('Storing rooms:', message.rooms);
    setAllRooms(message.rooms);

    // Filter the rooms based on the selected contract and current user ID
    const filteredRooms = message.rooms.filter(
        room => room.status === 'waiting' || room.player1_id === currentUser.id
    );

    console.log('Filtered rooms:', filteredRooms);
    setRooms(filteredRooms);
};



  
  
  const checkForActiveRoomOnConnect = () => {
    console.log("come here?")
    console.log(allRooms)  
    console.log("maybe?")
    const intervalId = setInterval(() => {
      if (allRooms.length > 0) {
        console.log("how about now?")
        // Assuming allRooms is already populated or updated after the initial fetchRooms call
        checkForActiveRoom(allRooms);
        clearInterval(intervalId); // Stop checking after the first successful room list fetch
      }
    }, 500); // Adjust the interval as needed
  };
  
  const checkForActiveRoom = (filteredRooms) => {
    console.log('Current userID:', userID);
    const currentUserID = userID.toString().trim();
  
    const activeRoom = filteredRooms.find(
      (room) => room.player1_id?.toString().trim() === currentUserID && room.status === 'waiting'
    );
  
    if (activeRoom) {
      console.log('Active room found:', activeRoom);
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
  
      if (currentUserID === activeRoom.player1_id?.toString().trim()) {
        setUserChoice(activeRoom.player1_choice);
      } else if (currentUserID === activeRoom.player2_id?.toString().trim()) {
        setUserChoice(activeRoom.player2_choice);
      }
    } else {
      console.log('No active room found for this user.');
    }
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
    console.log(choice)
    console.log("choice")
    setUserChoice(choice);
    sendMessage({
      type: 'MAKE_CHOICE',
      userID: userID.toString(),
      username,
      roomId: activeRoomId,  // Use activeRoomId here
      choice,
    });
  };
  

  const triggerTransfer = (roomId) => {
    sendMessage({ type: 'TRIGGER_TRANSFER', roomId });
  };

  const handleTryAgain = () => {
    sendMessage({
      type: 'TRY_AGAIN',
      roomId: activeRoomId,  // Use activeRoomId here
      userID: userID.toString(),
    });
  };
  

  const leaveGame = () => {
    if (activeRoomId) {
      // Remove the game status only for the current active room
      setGameStatuses((prevStatuses) => {
        const updatedStatuses = { ...prevStatuses };
        delete updatedStatuses[activeRoomId];  // Remove the game status for the active room only
        return updatedStatuses;
      });
  
      // Reset the active room and user choice
      setActiveRoomId(null);
      setUserChoice('');
  
      // Send the LEAVE_ROOM message to the server
      sendMessage({
        type: 'LEAVE_ROOM',
        userID: userID.toString(),
        username,
        roomId: activeRoomId,  // Use activeRoomId to identify the specific room
      });
  
      // Navigate back to the lobby
      setCurrentView('lobby');
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
        setToastVisible(true); // Show the toast
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

  const navigateToGamePage = (roomId) => {
    setActiveRoomId(roomId);
    setCurrentView('game');
  };
  
  
  const returnToLobby=()=> {
    setCurrentView('lobby');
    setActiveRoomId(null);
  };

  const isUserAllowed = allowedUserIDs.includes(userID.toString());

  if (!isUserAllowed) {
    return (
      <div className="loading-screen">
        <h1 className="loading-message">
          Game Under Maintenance<br />
          Please check back later.
        </h1>
      </div>
    );
  }

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

  if (isSessionTerminated) {
    return (
      <div className="loading-screen">
        <h1 className="loading-message">
          Session Terminated<br />
          The app is open elsewhere.
        </h1>
      </div>
    );
  }

  if (currentView === 'game' && activeRoomId) {
    const currentGameStatus = gameStatuses[activeRoomId];

    if (!currentGameStatus) {
        // If the game status for the active room is null, redirect to the lobby
        setCurrentView('lobby');
        return null;
    }

    const contract = contractAddresses.find(
        (c) => c.address === currentGameStatus.contractAddress
    );
    const contractSymbol = contract?.symbol || 'Unknown Symbol';
    const decimals = contract?.decimals || 1;
    const formattedWagerAmount = currentGameStatus?.wagerAmount
        ? (parseFloat(currentGameStatus.wagerAmount) / Math.pow(10, decimals)).toFixed(3)
        : 'N/A';

    // Determine the user’s choice from the current game status
    const userChoice = userID.toString() === currentGameStatus.player1ID.toString()
        ? currentGameStatus.player1Choice
        : currentGameStatus.player2Choice;

    return (
        <div className="App">
            <h1 className="welcome-message2">Room {activeRoomId}</h1>

            {/* Display the wager contract and amount */}
            <div className="wager-info">
                <p>
                    [{contractSymbol}: {formattedWagerAmount}]
                </p>
            </div>

            {currentGameStatus ? (
                <>
                    <h2 className="game-status">
                        {currentGameStatus.player1Username
                            ? `${currentGameStatus.player1Username}${
                                currentGameStatus.player1Choice ? '[✔️]' : '[❓]'
                            }`
                            : '[Pending]'}
                        {' vs '}
                        {currentGameStatus.player2Username
                            ? `${currentGameStatus.player2Username}${
                                currentGameStatus.player2Choice ? '[✔️]' : '[❓]'
                            }`
                            : '[Pending]'}
                    </h2>

                    <div className="game-status-message">
                        {renderGameStatusMessage(currentGameStatus)}
                    </div>

                    {currentGameStatus.status !== 'completed' && (
                        <>
                            <div className="choices">
                                {['Scissors', 'Paper', 'Stone'].map((choice) => (
                                    <button
                                        key={choice}
                                        className={`choice-button ${userChoice === choice ? 'selected' : ''}`}
                                        onClick={() => handleChoice(choice)}
                                        disabled={!!userChoice}
                                    >
                                        {choice}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

<div className="button-group">
    {(
        // "Return to Lobby" is available only to Player 1 when the game is "waiting" and Player 1 has made a choice, or when the game is "in_progress"
        (currentGameStatus.status === 'waiting' && currentGameStatus.player1Choice && userID.toString() === currentGameStatus.player1ID.toString()) 
        || 
        (currentGameStatus.status === 'in_progress' && userID.toString() === currentGameStatus.player1ID.toString())
    ) ? (
        <button className="return-button" onClick={returnToLobby}>
            Return to Lobby
        </button>
    ) : null}

    {(
        // "Exit Game" is always available to Player 2, or when the game is in "waiting" or "completed" status for either player
        (userID.toString() === currentGameStatus.player2ID.toString())
        || 
        (currentGameStatus.status === 'waiting' || currentGameStatus.status === 'completed')
    ) ? (
        <button className="return-button" onClick={leaveGame}>
            Exit Game
        </button>
    ) : null}
</div>


                    {currentGameStatus.status === 'completed' && (
                        <div>
                            {toastMessage && (
                                <Toast
                                    message={toastMessage}
                                    link={toastLink}
                                    onClose={() => {
                                        setToastMessage('');
                                        setToastLink('');
                                        setToastVisible(false);
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

