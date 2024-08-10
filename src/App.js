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

    console.log("URL Parameters:", {
      username: usernameFromParams,
      chat_id: chatId,
    });

    setUsername(usernameFromParams);

    const createGame = async () => {
        try {
            console.log("Attempting to create a game with:", {
              username: usernameFromParams,
              chat_id: chatId,
            });

            const response = await fetch('https://90a3-119-74-213-151.ngrok-free.app/webhook', {
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
                const errorText = await response.text();
                console.error("HTTP error! status:", response.status, "response:", errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Game created successfully. Game ID:", data.game_id);
            setGameId(data.game_id);  // Store the game ID for polling
        } catch (error) {
            console.error("Error creating game:", error);
        }
    };

    if (usernameFromParams) {
        createGame();
    } else {
        console.error("Username is missing in the URL parameters");
    }
}, []);


  const handleChoice = async (choice) => {
    const chatId = new URLSearchParams(window.location.search).get('chat_id');
    const username = new URLSearchParams(window.location.search).get('username');
    setUserChoice(choice);

    console.log("User choice:", {
      username: username,
      choice: choice,
      chat_id: chatId,
    });

    try {
      const response = await fetch('https://90a3-119-74-213-151.ngrok-free.app/webhook', {
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

      const gameId = await response.json();  // Parse the JSON response
      console.log("Received game ID after choice submission:", gameId);
      setGameId(gameId);  // Store the game ID for polling
    } catch (error) {
      console.error("Error sending choice:", error);
    }
  };

  useEffect(() => {
    if (!gameId) return;
  
    const pollGameStatus = async () => {
      console.log("Polling game status for game ID:", gameId);
      try {
        const response = await fetch(`https://your-ngrok-url/game_status?game_id=${gameId}`);
        const contentType = response.headers.get("Content-Type");
        console.log("Content-Type:", contentType);
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        if (contentType && contentType.includes("application/json")) {
          const gameData = await response.json();
          console.log("Received game status:", gameData);
  
          // Check if the game ID has changed
          if (gameData.game_id !== gameId) {
            setGameId(gameData.game_id); // Update to the new game ID
          }
  
          setGameStatus(gameData);
        } else {
          const textResponse = await response.text();
          console.error("Received non-JSON response:", textResponse);
          throw new Error("Expected JSON, but received non-JSON response");
        }
      } catch (error) {
        console.error("Error fetching game status:", error);
      }
    };
  
    pollingRef.current = setInterval(pollGameStatus, POLLING_INTERVAL);
  
    return () => {
      clearInterval(pollingRef.current);
    };
  }, [gameId]);
  

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
