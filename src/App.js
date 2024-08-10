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

    // Update gameStatus to reflect that the current user has made their choice
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
      }
    };
    pollingRef.current = setInterval(pollOpponentStatus, 3000);
  };

  // Second poll: Check for choices once opponent has joined
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

    if (data.status === 'completed') {
      clearInterval(pollingRef.current); // Stop polling when the game is completed
      console.log('Game completed:', data.result);
    }

    if (data.player2_choice) {
      setOpponentChoiceStatus(`${data.player2} has provided their choice.`);
      console.log(`${data.player2} has made their move:`, data.player2_choice);
    } else {
      setOpponentChoiceStatus(`Waiting for ${data.player2 || 'opponent'} to provide their choice.`);
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
            <p>{gameStatus.player1}: {gameStatus.player1_choice === 'made_choice' ? 'Made their move' : 'Waiting for choice'}</p>
            {gameStatus.player2 && <p>{gameStatus.player2}: {gameStatus.player2_choice === 'made_choice' ? 'Made their move' : 'Waiting for choice'}</p>}
            
            {gameStatus.status !== 'completed' && (
              <p>{opponentChoiceStatus}</p>
            )}
    
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
              <div>
                <h3>
                  {gameStatus.result.includes('wins') && gameStatus.player1 === username ? 'You Win!' : ''}
                  {gameStatus.result.includes('wins') && gameStatus.player2 === username ? 'You Lose!' : ''}
                  {gameStatus.result.includes('draw') ? 'It\'s a Draw!' : ''}
                </h3>
                <p>{gameStatus.result}</p>
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
      <button onClick={createRoom}>Create Room</button>
      <h2>Available Rooms:</h2>
      <div className="room-list">
        {Object.values(rooms).map((room) => (
          <div key={room.room_id} className="room-card">
            <div className="room-details">
              <p>Game ID: {room.room_id}</p>
              <p>{room.player1} vs {room.player2 || 'Waiting for opponent'}</p>
              <p>Status: {room.status}</p>
            </div>
            <button
              className="join-button"
              onClick={() => joinRoom(room.room_id)}
              disabled={room.status !== 'waiting'}
            >
              Join Room
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
