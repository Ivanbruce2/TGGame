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

 const startPollingOpponent = (roomId) => {
  const pollOpponentStatus = async () => {
    const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/list_rooms`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await response.json();

    // Assuming data is an array or object with rooms, find the room with the matching roomId
    const room = data[roomId]; // If data is an object with roomId as keys
    // If data is an array of rooms, find the room with the matching roomId
    // const room = data.find(room => room.room_id === roomId);

    if (room && room.player2) {
      clearInterval(pollingRef.current);
      setGameStatus({ ...gameStatus, player1: room.player1, player2: room.player2, status: 'in_progress' });
      console.log(`Player 1: ${room.player1}, Player 2: ${room.player2}`);
      startPollingChoices(roomId);
    }
  };
  pollingRef.current = setInterval(pollOpponentStatus, 3000);
};


  const startPollingChoices = (gameId) => {
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

      if (data.status === 'completed') {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        console.log('Game completed:', data.result);
      }

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
      setSelectedRoom(null);
    }
  };

  useEffect(() => {
    return () => clearInterval(pollingRef.current);
  }, []);

  if (selectedRoom) {
    return (
      <div className="App">
        <h1 className="welcome-message2">Room: {selectedRoom}</h1>
        {gameStatus ? (
  <>
    <h2>{gameStatus.player1 === username ? `${gameStatus.player1} vs ${gameStatus.player2 || 'Waiting for opponent'}` : `${gameStatus.player2} vs ${gameStatus.player1 || 'Waiting for opponent'}`}</h2>
    
    {/* Conditionally render player statuses only if the game is not completed */}
    {gameStatus.status !== 'completed' && (
      <div>
        <h2 className="game-status">
        <span>{gameStatus.player1}: {gameStatus.player1_choice ? 'Ready!' : 'Pending Action'}</span>
        <span> | </span>
        {gameStatus.player2 && <span>{gameStatus.player2}: {gameStatus.player2_choice ? 'Ready!' : 'Pending Action'}</span>}
      </h2>
      </div>
    )}

    {/* Render the choices */}
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

    {/* Render the opponent status below the choices */}
    {gameStatus.status !== 'completed' && (
      <p>{opponentChoiceStatus}</p>
    )}

    {/* Render the result when the game is completed */}
    {gameStatus.status === 'completed' && (
      <div>
        <p>{gameStatus.result.includes('Draw') ? "It's a Draw!" : gameStatus.result.split('! ')[1]}</p>
        <h2>
          {gameStatus.result.includes(username) ? 'You Win!' : gameStatus.result.includes('Draw') ? "It's a Draw!" : 'You Lose. Try again next time.'}
        </h2>
        <button className="pixel-button return-button" onClick={() => setSelectedRoom(null)}>
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
