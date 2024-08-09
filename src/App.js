import React, { useState, useEffect } from 'react';
import './App.css';

const choices = ["Scissors", "Paper", "Stone"];

function App() {
  const [username, setUsername] = useState('');
  const [userChoice, setUserChoice] = useState('');
  const [computerChoice, setComputerChoice] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const usernameFromParams = urlParams.get('username');
    console.log("Username from URL params:", usernameFromParams); // Log the username to verify
    setUsername(usernameFromParams);
  }, []);

  const getResult = (userChoice, computerChoice) => {
    if (userChoice === computerChoice) {
      return "It's a draw!";
    }
    switch (userChoice) {
      case "Scissors":
        return (computerChoice === "Paper") ? "You win!" : "You lose!";
      case "Paper":
        return (computerChoice === "Stone") ? "You win!" : "You lose!";
      case "Stone":
        return (computerChoice === "Scissors") ? "You win!" : "You lose!";
      default:
        return "Invalid choice!";
    }
  };

const handleChoice = async (choice) => {
  const chatId = new URLSearchParams(window.location.search).get('chat_id');
  const username = new URLSearchParams(window.location.search).get('username');
  setUserChoice(choice);
  const computerChoice = choices[Math.floor(Math.random() * choices.length)];
  setComputerChoice(computerChoice);
  const result = getResult(choice, computerChoice);
  setResult(result);

  // Send result to Telegram Web App and your webhook
  window.Telegram.WebApp.sendData(`@${username} chose ${choice}. Computer chose ${computerChoice}. ${result}`);

  const response = await fetch('/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      username: username,
      choice: choice,
      chat_id: chatId,
      result: result,
    }),
  });

  const resultText = await response.text();
  console.log("Response from webhook:", resultText);
};


  return (
    <div className="App">
      <h1>Welcome {username}!</h1>
      <h2>Let's play Scissors, Paper, Stone</h2>
      <div className="choices">
        {choices.map(choice => (
          <button key={choice} className="choice-button" onClick={() => handleChoice(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {userChoice && <p>You chose: {userChoice}</p>}
      {computerChoice && <p>Computer chose: {computerChoice}</p>}
      {result && <p className="result">{result}</p>}
      {result && <button className="try-again-button" onClick={() => { setUserChoice(''); setComputerChoice(''); setResult(''); }}>Try Again</button>}
    </div>
  );
}

export default App;
