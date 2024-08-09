import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const choices = ["Scissors", "Paper", "Stone"];
const POLLING_INTERVAL = 3000; // Poll every 3 seconds

function App() {
  const [username, setUsername] = useState('');
  const [userChoice, setUserChoice] = useState('');
  const [gameId, setGameId] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    setUsername(usernameFromParams);

    const chatId = urlParams.get('chat_id');
    
    // Trigger game creation immediately when the page loads
    const createGame = async () => {
      const response = await fetch('https://your-backend-url/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: usernameFromParams,
          chat_id: chatId,
        }),
      });

      if (!response.ok) {
        console.error("Failed to create game");
        return;
      }

      const gameId = await response.text();
      console.log("Received game ID:", gameId);
      setGameId(gameId);
    };

    createGame();
  }, []);

  useEffect(() => {
    if (!gameId) return;

    // Define the polling function
    const pollGameStatus = async () => {
      const response = await fetch(`https://your-backend-url/game_status?game_id=${gameId}`);
      if (response.ok) {
        const gameData = await response.json();
        setGameStatus(gameData);
      }
    };

    // Start polling
    pollingRef.current = setInterval(pollGameStatus, POLLING_INTERVAL);

    // Clean up on component unmount
    return () => {
      clearInterval(pollingRef.current);
    };
  }, [gameId]);

  const handleChoice = async (choice) => {
    setUserChoice(choice);

    const chatId = new URLSearchParams(window.location.search).get('chat_id');

    // Send choice to backend
    await fetch('https://your-backend-url/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: username,
        choice: choice,
        chat_id: chatId,
      }),
    });
  };

  // Render based on gameStatus
  if (!gameStatus) {
    return <div>Loading game status...</div>;
  }

  return (
    <div className="App">
      <h1>Welcome {username}! Please select your choice:</h1>
      <div className="choices">
        {choices.map(choice => (
          <button key={choice} onClick={() => handleChoice(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {userChoice && <p>You chose: {userChoice}</p>}
      {gameStatus.Status === 'completed' && (
        <div>
          <p>Your Choice: {gameStatus.Player1Choice}</p>
          <p>Opponent's Choice: {gameStatus.Player2Choice}</p>
          <h3>{gameStatus.Result}</h3>
        </div>
      )}
    </div>
  );
}

export default App;
