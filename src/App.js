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
    const chatId = urlParams.get('chat_id');
    setUsername(usernameFromParams);

    // Trigger game creation immediately when the page loads
    const createGame = async () => {
      try {
        const response = await fetch('https://aa53-119-74-213-151.ngrok-free.app/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Ngrok-Skip-Browser-Warning': 'true',
            'User-Agent': 'MyCustomUserAgent',  // Set a custom User-Agent string
          },
          body: new URLSearchParams({
            username: usernameFromParams,
            chat_id: chatId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("HTTP error! status:", response.status, "response:", errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();  // Parse the JSON response
        const gameId = data.game_id;
        console.log("Received game ID:", gameId);
        setGameId(gameId);  // Store the game ID for polling
      } catch (error) {
        console.error("Error creating game:", error);
      }
    };

    createGame();
  }, []);

  useEffect(() => {
    if (!gameId) return;

    // Define the polling function
    const pollGameStatus = async () => {
      const response = await fetch(`https://aa53-119-74-213-151.ngrok-free.app/game_status?game_id=${gameId}`);
      if (response.ok) {
        const gameData = await response.json();
        setGameStatus(gameData);
      } else {
        console.error("Failed to fetch game status.");
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
    const chatId = new URLSearchParams(window.location.search).get('chat_id');
    const username = new URLSearchParams(window.location.search).get('username');
    setUserChoice(choice);
  
    try {
      const response = await fetch('https://aa53-119-74-213-151.ngrok-free.app/webhook', {
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
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("HTTP error! status:", response.status, "response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();  // Parse the JSON response
  
      if (data.game_id) {
        console.log("Received game ID:", data.game_id);
        setGameId(data.game_id);  // Store the game ID for polling
      } else {
        console.error("Unexpected response:", data);  // Handle unexpected responses
      }
  
    } catch (error) {
      console.error("Error creating game:", error);
    }
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
