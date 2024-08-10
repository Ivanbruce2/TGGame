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
  }, []);

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
    startPollingOpponent(data.room_id);
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
    startPollingOpponent(data.room_id);
  };

  const handleChoice = async (choice) => {
    setUserChoice(choice);
    console.log(`${username} selected:`, choice);
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
    startPollingChoices(data.game_id);
  };

  // First poll: Check for opponent presence
  const startPollingOpponent = (roomId) => {
    const pollOpponentStatus = async () => {
      const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/list_rooms`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const data = await response.json();
      const room = data[roomId];
      if (room && room.player2) {
        clearInterval(pollingRef.current); // Stop polling for opponent once joined
        setGameStatus({ ...gameStatus, player1: room.player1, player2: room.player2, status: 'in_progress' });
        console.log(`Player 1: ${room.player1}, Player 2: ${room.player2}`); // Log Player 1 and Player 2
        startPollingChoices(room.room_id); // Start polling choices after both players have joined
      }
    };
    pollingRef.current = setInterval(pollOpponentStatus, 3000);
  };

  // Second poll: Check for choices once opponent has joined
  const startPollingChoices = (gameId) => {
    const pollGameStatus = async () => {
      const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/game_status?game_id=${gameId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const data = await response.json();
      setGameStatus(data);

      // Update readiness status in real-time
      let player1Status = data.player1 === username ? 'You' : data.player1;
      let player2Status = data.player2 === username ? 'You' : data.player2;

      player1Status += data.player1_choice ? ' (Ready)' : ' (Not Ready)';
      player2Status += data.player2_choice ? ' (Ready)' : ' (Not Ready)';

      setOpponentChoiceStatus(`${player1Status} vs ${player2Status}`);

      console.log('Game status updated:', data);
    };
    pollingRef.current = setInterval(pollGameStatus, 3000);
  };

  useEffect(() => {
    return () => clearInterval(pollingRef.current); // Cleanup on component unmount
  }, []);

  if (selectedRoom) {
    return (
      <div className="App">
        <h1>Room: {selectedRoom}</h1>
        {gameStatus ? (
          <>
            <h2>{gameStatus.player1 === username ? 'You' : gameStatus.player1} vs {gameStatus.player2 || 'Waiting for opponent'}</h2>
            <p>{opponentChoiceStatus}</p>
            {gameStatus.status !== 'completed' && (
              <div className="choices">
                {["Scissors", "Paper", "Stone"].map(choice => (
                  <button key={choice} onClick={() => handleChoice(choice)} disabled={!!userChoice}>
                    {choice}
                  </button>
                ))}
              </div>
            )}
            {gameStatus.status === 'completed' && (
              <h3>
                {gameStatus.result
                  .replace(gameStatus.player1, gameStatus.player1 === username ? 'You' : gameStatus.player1)
                  .replace(gameStatus.player2, gameStatus.player2 === username ? 'You' : gameStatus.player2)
                  .replace("wins!", gameStatus.player1 === username ? (gameStatus.result.includes("wins!") ? "win!" : "lose!") : (gameStatus.result.includes("wins!") ? "win!" : "lose!"))}
              </h3>
            )}
          </>
        ) : (
          <>
            <p>Select your choice below:</p>
            <div className="choices">
              {["Scissors", "Paper", "Stone"].map(choice => (
                <button key={choice} onClick={() => handleChoice(choice)}>
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
      <h1>Welcome, {username}</h1>
      <button onClick={createRoom}>Create Room</button>
      <h2>Available Rooms:</h2>
      <div className="room-list">
        {Object.values(rooms).map((room) => (
          <div className="room-card" key={room.room_id}>
            <div className="room-details">
              <p>Game ID: {room.room_id}</p>
              <p>{room.player1} vs {room.player2 || 'Waiting for opponent'}</p>
              <p>Status: {room.status}</p>
            </div>
            {room.status === 'waiting' && (
              <button className="join-button" onClick={() => joinRoom(room.room_id)}>Join Room</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
