import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');
  const [opponentChoiceStatus, setOpponentChoiceStatus] = useState('');
  const pollingRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    setUsername(usernameFromParams);
    fetchRooms();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveRoom(); // Ensures the user leaves the room if the component unmounts
    };
  }, [selectedRoom]);

  const handleBeforeUnload = (event) => {
    leaveRoom();
    event.returnValue = ''; // This prompts the user before leaving
  };

  const fetchRooms = async () => {
    const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/list_rooms`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const data = await response.json();
    setRooms(data);
    console.log('Rooms fetched:', data);
  };

  const createRoom = async () => {
    setGameStatus(null);  // Reset game status
    setUserChoice('');    // Reset user choice
    setOpponentChoiceStatus('');  // Reset opponent choice status
    
    const response = await fetch('https://90a3-119-74-213-151.ngrok-free.app/create_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ngrok-skip-browser-warning': 'true',
      },
      body: new URLSearchParams({
        username: username,
      }),
    });
    const data = await response.json();
    setSelectedRoom(data.room_id);
    console.log(`${username} created room:`, data.room_id);
    console.log("Initial gameStatus after room creation:", gameStatus);
  
    startPollingChoices(data.room_id);
  };
  
  

  const joinRoom = async (room_id) => {
    const response = await fetch('https://90a3-119-74-213-151.ngrok-free.app/join_room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'ngrok-skip-browser-warning': 'true',
      },
      body: new URLSearchParams({
        username: username,
        room_id: room_id,
      }),
    });
    const data = await response.json();
    setSelectedRoom(data.room_id);
    console.log(`${username} joined room:`, data.room_id);
    startPollingChoices(data.room_id);
  };

  const startPollingChoices = (roomId) => {
    let errorCount = 0;

    const pollGameStatus = async () => {
        try {
            // Fetch the game status directly
            const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/game_status?game_id=${roomId}`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) {
                throw new Error("Game not found");
            }

            const gameData = await response.json();
            setGameStatus(gameData);
            console.log("Polling game status, current game data:", gameData);

            // Reset error count if the game is found
            errorCount = 0;

            // Check if both players are present and if they have made their choices
            if (gameData.player2) {
                if (!gameData.player1_choice || !gameData.player2_choice) {
                    console.log("Waiting for players to make their choices...");
                } else {
                    console.log("Both players have made their choices. Determining the result...");
                    clearInterval(pollingRef.current);
                    // Handle the result here (e.g., update the UI, declare the winner, etc.)
                }
            } else {
                console.log("No opponent yet, waiting for player 2 to join.");
            }
        } catch (error) {
            console.error("Error polling game status:", error);
            errorCount += 1;

            if (errorCount === 1) {
                // First polling error: start a timeout to return to the lobby after 5 seconds
                console.log("First polling error encountered. Returning to lobby in 5 seconds...");
                setTimeout(() => {
                    clearInterval(pollingRef.current);
                    console.log("Returning to lobby after game not found.");
                    setSelectedRoom(null);
                    setGameStatus(null);
                    setUserChoice('');
                    setOpponentChoiceStatus('');
                }, 5000); // 5-second delay
            }
        }
    };

    pollingRef.current = setInterval(pollGameStatus, 3000);
};



  
  const handleChoice = async (choice) => {
    setUserChoice(choice);
    console.log(`${username} selected:`, choice);

    try {
        const response = await fetch('https://90a3-119-74-213-151.ngrok-free.app/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'ngrok-skip-browser-warning': 'true',
            },
            body: new URLSearchParams({
                username: username,
                choice: choice,
                room_id: selectedRoom,
            }),
        });

        const data = await response.json();
        setGameStatus(data); // Update the game status with the response from the server
        console.log("Game status updated:", data);

        // Optionally, start polling for the opponent's choice if the game is not yet completed
        
            startPollingChoices(selectedRoom);
        
    } catch (error) {
        console.error("Error in handleChoice:", error);
    }
};

  

  const leaveRoom = async () => {
    if (selectedRoom) {
      await fetch('https://90a3-119-74-213-151.ngrok-free.app/leave_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true',
        },
        body: new URLSearchParams({
          username: username,
          room_id: selectedRoom,
        }),
      });
      console.log(`${username} left room:`, selectedRoom);
      
      // Reset relevant states
      setSelectedRoom(null);
      setGameStatus(null);
      setUserChoice('');
      setOpponentChoiceStatus('');
    }
  };
  

  useEffect(() => {
    return () => clearInterval(pollingRef.current);
  }, []);

  if (selectedRoom) {
    console.log("Rendering game screen. Current gameStatus:", gameStatus);
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

            {/* Render the choices for Player 1 regardless of Player 2's status */}
            {gameStatus.status !== 'completed' && (
              <div className="choices">
                {["Scissors", "Paper", "Stone"].map(choice => (
                  <button 
                    key={choice} 
                    className="choice-button" 
                    onClick={() => handleChoice(choice)} 
                    disabled={!!userChoice} // Disable after Player 1 makes a choice
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {/* Render the opponent status below the choices */}
            {gameStatus.status !== 'completed' && (
              <p>{opponentChoiceStatus || 'Waiting for opponent to join...'}</p>
            )}

            {/* Render the result when the game is completed */}
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
                  setOpponentChoiceStatus('');
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
            {userChoice && !gameStatus?.player2 && <p>{opponentChoiceStatus || 'Waiting for opponent to join...'}</p>}
          </>
        )}
      </div>
    );
  }

  

  return (
    <div className="App">
      <div className="container">
        <h1 className="welcome-message">Welcome, {username}</h1>
        <div class="header-row">
          <button class="pixel-button create-button" onClick={createRoom}>Create Room</button>
          <button class="pixel-button refresh-button" onClick={fetchRooms}>↻</button>
        </div>
        <div className="room-list">
          {Object.values(rooms).map((room) => (
            <div className="room-card" key={room.room_id}>
              <div className="room-details">
                <p>Game ID: {room.room_id}</p>
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
