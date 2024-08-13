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
  const [countdown, setCountdown] = useState(0); // State to track the countdown
  const pollingRef = useRef(null);
  const roomPollingRef = useRef(null);
  const choiceTimeoutRef = useRef(null);
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
      clearTimeout(choiceTimeoutRef.current);
    };
  }, [selectedRoom]);

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = '';
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(`https://bf624dc291e08644f85d1314883bcc30.serveo.net/list_rooms`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
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
    const pollGameStatus = async () => {
      try {
        const response = await fetch(`https://bf624dc291e08644f85d1314883bcc30.serveo.net/game_status?room_id=${roomId}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (response.status === 404) {
          clearInterval(pollingRef.current);
          setTimeout(() => {
            setSelectedRoom(null);
            setGameStatus(null);
          }, 5000);
          return;
        }

        const data = await response.json();
        setGameStatus(data);

        if (data.status === "completed") {
          clearInterval(pollingRef.current);
        } else if (!data.player1_choice || !data.player2_choice) {
          console.log("Waiting for players to make their choices...");
        } else {
          clearInterval(pollingRef.current);
        }
      } catch (error) {
        console.error("Error during polling:", error);
        clearInterval(pollingRef.current);
        setSelectedRoom(null);
        setGameStatus(null);
      }
    };

    pollingRef.current = setInterval(pollGameStatus, 3000);
  };

  const startChoiceCountdown = () => {
    setCountdown(10); // Start a 10-second countdown
    const intervalId = setInterval(() => {
      setCountdown(prevCountdown => {
        if (prevCountdown === 1) {
          clearInterval(intervalId);
          leaveGame(); // Kick the player out if no choice is made within the time limit
        }
        return prevCountdown - 1;
      });
    }, 1000);
  };

  const createRoom = async () => {
    if (!userID) {
      console.error("UserID is empty. Cannot create room.");
      return;
    }

    setGameStatus(null);
    setUserChoice('');

    try {
      const response = await fetch('https://bf624dc291e08644f85d1314883bcc30.serveo.net/create_room', {
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

      // Set a timeout for player 1 to make a choice within 60 seconds
      choiceTimeoutRef.current = setTimeout(() => {
        if (!userChoice) {
          console.log("Player 1 did not make a choice within 60 seconds, leaving the game.");
          leaveGame();
        }
      }, 60000);

      startPollingChoices(data.room_id);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const response = await fetch('https://bf624dc291e08644f85d1314883bcc30.serveo.net/join_room', {
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
        startChoiceCountdown(); // Start the countdown for both players
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
      const response = await fetch('https://bf624dc291e08644f85d1314883bcc30.serveo.net/webhook', {
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

      clearTimeout(choiceTimeoutRef.current); // Clear the timeout if the choice is made
    } catch (error) {
      console.error("Error in handleChoice:", error);
    }
  };

  const leaveGame = async () => {
    if (selectedRoom) {
      await fetch('https://bf624dc291e08644f85d1314883bcc30.serveo.net/leave_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true',
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

      clearTimeout(choiceTimeoutRef.current); // Clear the timeout on leave
    }
  };

  useEffect(() => {
    return () => {
      clearInterval(pollingRef.current);
      clearInterval(roomPollingRef.current);
      clearTimeout(choiceTimeoutRef.current);
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
            )}

            {gameStatus.status !== 'completed' && (
              <>
                <p>Waiting for opponent...</p>
                {!gameStatus.player2 && (
                  <button className="return-button" onClick={leaveGame}>
                    Return to Lobby
                  </button>
                )}
              </>
            )}

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
            <p>Time left: {countdown} seconds</p> {/* Display countdown */}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <div class="container">
        <h1 className="welcome-message">Welcome, {username}</h1>
        <div class="header-row">
          <button class="pixel-button create-button" onClick={createRoom}>Create Room</button>
          <button class="pixel-button refresh-button" onClick={fetchRooms}>↻</button>
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
