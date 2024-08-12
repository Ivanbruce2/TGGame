import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [username, setUsername] = useState('');
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [userChoice, setUserChoice] = useState('');
  const [opponentChoiceStatus, setOpponentChoiceStatus] = useState('');
  const pollingRef = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    setUsername(usernameFromParams);
    fetchGames();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      leaveGame(); // Ensures the user leaves the game if the component unmounts
    };
  }, [selectedGame]);

  const handleBeforeUnload = (event) => {
    leaveGame();
    event.returnValue = ''; // This prompts the user before leaving
  };

  const fetchGames = async () => {
    const response = await fetch(`https://efb5-119-74-213-151.ngrok-free.app/list_rooms`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const data = await response.json();
    setGames(data);
    console.log('Games fetched:', data);
  };

  const createGame = async () => {
    setGameStatus(null);  // Reset game status
    setUserChoice('');    // Reset user choice
    setOpponentChoiceStatus('');  // Reset opponent choice status
    
    const response = await fetch('https://efb5-119-74-213-151.ngrok-free.app/create_room', {
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
    setSelectedGame(data.game_id);
    console.log(`${username} created game:`, data.game_id);
  
    startPollingChoices(data.game_id);
  };

  const startPollingChoices = (gameId) => {
    const pollGameStatus = async () => {
        try {
            const response = await fetch(`https://efb5-119-74-213-151.ngrok-free.app/game_status?game_id=${gameId}`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (response.status === 404) {
                console.log("Error polling game status: Game not found");
                clearInterval(pollingRef.current);

                console.log("Returning to lobby in 5 seconds...");
                setTimeout(() => {
                    setSelectedGame(null);
                    setGameStatus(null);
                }, 5000);
                return;
            }

            const data = await response.json();
            setGameStatus(data);

            if (data.status === "completed") {
                console.log("Game completed, stopping polling.");
                clearInterval(pollingRef.current);
            } else if (!data.player1_choice || !data.player2_choice) {
                console.log("Waiting for players to make their choices...");
            } else {
                console.log("Both players have made their choices. Determining the result...");
                clearInterval(pollingRef.current);
            }

            console.log("Game status updated:", data);
        } catch (error) {
            console.error("Error during polling:", error);
            clearInterval(pollingRef.current);
            setSelectedGame(null);
            setGameStatus(null);
        }
    };

    pollingRef.current = setInterval(pollGameStatus, 3000);
};

const joinGame = async (game_id) => {
  try {
      const response = await fetch('https://efb5-119-74-213-151.ngrok-free.app/join_room', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'ngrok-skip-browser-warning': 'true',
          },
          body: new URLSearchParams({
              username: username,
              game_id: game_id,
          }),
      });

      const data = await response.json();

      if (data && data.game_id) {
          setSelectedGame(data.game_id);
          console.log(`${username} joined game:`, data.game_id);
          startPollingChoices(data.game_id);
      } else {
          console.error("Unexpected response data:", data);
      }
  } catch (error) {
      console.error("Error in joinGame:", error);
  }
};

const handleChoice = async (choice) => {
    setUserChoice(choice);
    console.log(`${username} selected:`, choice);

    try {
        const response = await fetch('https://efb5-119-74-213-151.ngrok-free.app/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'ngrok-skip-browser-warning': 'true',
            },
            body: new URLSearchParams({
                username: username,
                choice: choice,
                game_id: selectedGame,
            }),
        });

        const data = await response.json();
        setGameStatus(data); // Update the game status with the response from the server
        console.log("Game status updated:", data);

        if (data.status !== "completed") {
            startPollingChoices(selectedGame);
        }
    } catch (error) {
        console.error("Error in handleChoice:", error);
    }
};

const leaveGame = async () => {
    if (selectedGame) {
      await fetch('https://efb5-119-74-213-151.ngrok-free.app/leave_room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'ngrok-skip-browser-warning': 'true',
        },
        body: new URLSearchParams({
          username: username,
          game_id: selectedGame,
        }),
      });
      console.log(`${username} left game:`, selectedGame);
      
      setSelectedGame(null);
      setGameStatus(null);
      setUserChoice('');
      setOpponentChoiceStatus('');
    }
};

useEffect(() => {
    return () => clearInterval(pollingRef.current);
  }, []);

  if (selectedGame) {
    console.log("Rendering game screen. Current gameStatus:", gameStatus);
    return (
      <div className="App">
        <h1 className="welcome-message2">Game: {selectedGame}</h1>
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
              <p>{opponentChoiceStatus || 'Waiting for opponent to join...'}</p>
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
                  setSelectedGame(null);
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
      <div class="container">
        <h1 className="welcome-message">Welcome, {username}</h1>
        <div class="header-row">
          <button class="pixel-button create-button" onClick={createGame}>Create Game</button>
          <button class="pixel-button refresh-button" onClick={fetchGames}>↻</button>
        </div>
        <div className="room-list">
  {Object.values(games).map((game) => (
    <div className="room-card" key={game.game_id}>
      <div className="room-details">
        <p>Game ID: {game.game_id}</p>
        <p>{game.status === 'waiting' ? `Player: ${game.player1}` : `${game.player1} vs ${game.player2}`}</p>
        <p>Status: {game.status === 'waiting' ? 'Waiting for opponent' : game.status}</p>
      </div>
      {game.status === 'waiting' && (
        <button className="join-button" onClick={() => joinGame(game.game_id)}>
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
