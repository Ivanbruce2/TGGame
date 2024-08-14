import React, { useState, useEffect, useRef } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import './App.css';

function App() {
  const [userID, setUserID] = useState('');
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');
  const pollingRef = useRef(null);
  const roomPollingRef = useRef(null);
  const { initDataRaw, initData } = retrieveLaunchParams();

  useEffect(() => {
    const retrievedUsername = initData.user.username || "Unknown Username";
    const retrievedUserID = initData.user.id || "Unknown UserID";

    setUserID(retrievedUserID);
    setUsername(retrievedUsername);
    startPollingRooms();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveGame();
      clearInterval(roomPollingRef.current);
      clearInterval(pollingRef.current);
    };
  }, [selectedRoom]);

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/list_rooms`, {
        headers: {
        
        }
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const startPollingRooms = () => {
    roomPollingRef.current = setInterval(fetchRooms, 5000);
  };

  const startPollingChoices = (roomId) => {
   
    try {
      console.log("startPollingChoices called with roomId:", roomId); // Log at the start of the function
  
      const pollGameStatus = async () => {
        try {
          console.log("pollGameStatus function is being called");
      
          const response = await fetch(`https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/game_status?room_id=${roomId}`, {
            headers: {
           
            }
          });
      
          console.log("Received response:", response.status); // Log the response status
          
          if (response.status === 404) {
            console.log("Room not found, stopping polling.");
            clearInterval(pollingRef.current);
            setTimeout(() => {
              setSelectedRoom(null);
              setGameStatus(null);
            }, 5000);
            return;
          }
      
          const data = await response.json();
          console.log("Game status:", data); // Log game status
          setGameStatus(data);
      
          if (data.status === "completed") {
            console.log("Game completed, stopping polling.");
            clearInterval(pollingRef.current);
          }
        } catch (error) {
          console.error("Error during polling:", error);
          clearInterval(pollingRef.current);
          setSelectedRoom(null);
          setGameStatus(null);
        }
      };
      
  
      console.log("Setting up polling interval...");
      clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        console.log("Interval triggered for polling status.");
        pollGameStatus(); // Call the function here
      }, 3000);
  
      console.log("Polling interval set for room:", roomId);
    } catch (error) {
      console.error("Error in startPollingChoices:", error);
    }
  };
  
  const createRoom = async () => {
    if (!userID) {
      console.error("UserID is empty. Cannot create room.");
      return;
    }
  
    setGameStatus({
      status: 'waiting',
      player1: username,
      player1_choice: null,
      player2: null,
      player2_choice: null,
      result: null
    });
  
    setUserChoice('');
  
    try {
      const response = await fetch('https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/create_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
        }),
      });
  
      const data = await response.json();
      setSelectedRoom(data.room_id);
      startPollingChoices(data.room_id);  // Pass room_id directly
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };
  
  
  
  const joinRoom = async (roomId) => {
    try {
      const response = await fetch('https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/join_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          userid: userID,
          username: username,
          room_id: roomId,
        }),
      });
  
      const data = await response.json();
  
      if (data && data.room_id) {
        setSelectedRoom(data.room_id);
        startPollingChoices(data.room_id);
      } else {
        console.error("Unexpected response data:", data);
      }
    } catch (error) {
      console.error("Error in joinRoom:", error);
    }
  };
  

  const handleChoice = async (choice) => {
    setUserChoice(choice);

    try {
      const response = await fetch('https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/webhook', {
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

      const data = await response.json();
      setGameStatus(data);

      if (data.status !== "completed") {
        startPollingChoices(selectedRoom);
      }
    } catch (error) {
      console.error("Error in handleChoice:", error);
    }
  };

  const leaveGame = async () => {
    if (selectedRoom) {
      console.log(selectedRoom)
      console.log(username)
      console.log(userID)
      await fetch('https://f41565fe508e58ee8dd59a38081b8ac9.serveo.net/leave_room', {
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

  if (selectedRoom) {
    return (
      <div className="App">
        <h1 className="welcome-message2">Room: {selectedRoom}</h1>
        {gameStatus ? (
          <>
            <h2 className="game-status">
              {gameStatus.player1 ? `${gameStatus.player1} ${gameStatus.player1_choice ? '✔️' : '❓'}` : '[Pending]'}
              {' vs '}
              {gameStatus.player2 ? `${gameStatus.player2} ${gameStatus.player2_choice ? '✔️' : '❓'}` : '[Pending]'}
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

            {/* The Return to Lobby button should always be visible when the game is in waiting or in progress */}
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
                <button className="return-button" onClick={() => {
                  setSelectedRoom(null);
                  setGameStatus(null);
                  setUserChoice('');
                }}>
                  Return to Lobby
                </button>
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
    <div className="App">
      <div className="container">
        <h1 className="welcome-message">Welcome, {username}</h1>
        <div className="header-row">
          <button className="pixel-button create-button" onClick={createRoom}>Create Room</button>
          <button className="pixel-button refresh-button" onClick={fetchRooms}>↻</button>
        </div>
        <div className="room-list">
          {Object.values(rooms).map((room) => (
            <div className="room-card" key={room.room_id}>
              <div className="room-details">
                <p>Room ID: {room.room_id}</p>
                <p>{room.status === 'waiting' ? `Player: ${room.player1}` : `${room.player1} vs ${room.player2}`}</p>
                <p>Status: {room.status === 'waiting' ? 'Waiting for opponent' : room.status}</p>
              </div>
              {room.status === 'waiting' && (
                <button className="join-button" onClick={() => joinRoom(room.room_id)}>
                  <b>JOIN</b>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
