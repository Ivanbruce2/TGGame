import React, { useState, useEffect } from 'react';
import './App.css';

const choices = ["Scissors", "Paper", "Stone"];

function App() {
  const [username, setUsername] = useState('');
  const [userChoice, setUserChoice] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    console.log("Username from URL params:", usernameFromParams); // Log the username to verify
    setUsername(usernameFromParams);
  }, []);

  const handleChoice = async (choice) => {
    const chatId = new URLSearchParams(window.location.search).get('chat_id');

    const response = await fetch('/webhook', {
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

    const resultText = await response.text();
    setResult(`You chose ${choice}. ${resultText}`);
    window.Telegram.WebApp.sendData(resultText);
  };

  return (
    <div className="App">
      <h1>Hi {username}! Please select your choice:</h1>
      <div className="choices">
        {choices.map(choice => (
          <button key={choice} onClick={() => handleChoice(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {result && <p>{result}</p>}
      {result && <button onClick={() => setResult('')}>Try Again</button>}
    </div>
  );
}

export default App;
