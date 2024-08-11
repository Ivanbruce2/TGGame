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
  };

  const handleChoice = async (choice) => {
    setUserChoice(choice);
    console.log(`${username} selected:`, choice);
    
    // Update gameStatus immediately to reflect that the current user has made their choice
    setGameStatus(prevStatus => ({
        ...prevStatus,
        [`${username === prevStatus.player1 ? 'player1_choice' : 'player2_choice'}`]: 'made_choice'
    }));

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


// First poll: Check for opponent presence and then start polling game status
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
      startPollingChoices(roomId);  // Start polling game status
    }
  };
  pollingRef.current = setInterval(pollOpponentStatus, 3000);
};

// Second poll: Check for choices once opponent has joined
const startPollingChoices = (gameId) => {
  // Clear any existing polling interval before starting a new one
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
  }

  const pollGameStatus = async () => {
    const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/game_status?game_id=${gameId}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await response.json();
    setGameStatus(data);

    // Stop polling when the game is completed
    if (data.status === 'completed') {
      clearInterval(pollingRef.current);
      pollingRef.current = null; // Clear the ref to indicate no active polling
      console.log('Game completed:', data.result);
    }

    // Update UI for choices and results
    if (data.player1_choice && data.player2_choice) {
      setOpponentChoiceStatus('Both players have made their move.');
    } else if (data.player1_choice && !data.player2_choice) {
      setOpponentChoiceStatus(`${data.player2} is waiting to make a choice.`);
    } else if (!data.player1_choice && data.player2_choice) {
      setOpponentChoiceStatus(`${data.player1} is waiting to make a choice.`);
    } else {
      setOpponentChoiceStatus('Waiting for both players to make a choice.');
    }

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
            <h2>{gameStatus.player1 === username ? `${gameStatus.player1} vs ${gameStatus.player2 || 'Waiting for opponent'}` : `${gameStatus.player2} vs ${gameStatus.player1 || 'Waiting for opponent'}`}</h2>
            
            {/* Conditionally render player statuses only if the game is not completed */}
            {gameStatus.status !== 'completed' && (
              <div>
                <span>{gameStatus.player1}: {gameStatus.player1_choice ? 'Ready!' : 'Waiting for choice'}</span>
                <span> | </span>
                {gameStatus.player2 && <span>{gameStatus.player2}: {gameStatus.player2_choice ? 'Ready!' : 'Waiting for choice'}</span>}
              </div>
            )}
    
            {/* Render the choices */}
            {gameStatus.status !== 'completed' && (
              <div className="choices">
                {["Scissors", "Paper", "Stone"].map(choice => (
                  <button key={choice} onClick={() => handleChoice(choice)} disabled={!!userChoice}>
                    {choice}
                  </button>
                ))}
              </div>
            )}
    
            {/* Render the opponent status below the choices */}
            {gameStatus.status !== 'completed' && (
              <p>{opponentChoiceStatus}</p>
            )}
    
            {/* Render the result when the game is completed */}
            {gameStatus.status === 'completed' && (
              <div>
                <h3>
                  {gameStatus.result.includes(username) ? 'You Win!' : 'You Lose. Try again next time.'}
                </h3>
                <p>{gameStatus.result.split('! ')[1]}</p>
              </div>
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
      <button onClick={createRoom} className="create-button">Create Room</button>
      <div className="header-row">
        <h2>Available Rooms:</h2>
        <button className="refresh-button" onClick={fetchRooms}>Refresh</button>
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
                Join<br />Room
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
