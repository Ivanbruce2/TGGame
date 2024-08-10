import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    setUsername(usernameFromParams);
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/list_rooms`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'  // Add this header to skip ngrok's warning page
      }
    });
    const data = await response.json();
    setRooms(data);
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
  };

  const handleChoice = async (choice) => {
    setUserChoice(choice);
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
    startPolling(data.game_id);
  };

  const startPolling = (gameId) => {
    const pollGameStatus = async () => {
      const response = await fetch(`https://90a3-119-74-213-151.ngrok-free.app/game_status?game_id=${gameId}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true'  // Add this header to skip ngrok's warning page
        }
      });
   
      const data = await response.json();
      setGameStatus(data);
    };
    setInterval(pollGameStatus, 3000);
  };

  if (selectedRoom) {
    return (
      <div className="App">
        <h1>Room: {selectedRoom}</h1>
        {gameStatus ? (
          <>
            <p>{gameStatus.player1}: {gameStatus.player1_choice}</p>
            {gameStatus.player2 && <p>{gameStatus.player2}: {gameStatus.player2_choice}</p>}
            {gameStatus.status === 'completed' && <h3>{gameStatus.result}</h3>}
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
            {userChoice && !gameStatus?.player2 && <p>Waiting for opponent to join...</p>}
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
      <table>
        <thead>
          <tr>
            <th>Room ID</th>
            <th>Player 1</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(rooms).map((room) => (
            <tr key={room.room_id}>
              <td>{room.room_id}</td>
              <td>{room.player1}</td>
              <td>{room.status}</td>
              <td>
                {room.status === 'waiting' && (
                  <button onClick={() => joinRoom(room.room_id)}>Join Room</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
