import React, { useState, useEffect } from 'react';
import './App.css';

const choices = ["Scissors", "Paper", "Stone"];

function App() {
  const [username, setUsername] = useState('');
  const [userChoice, setUserChoice] = useState('');
  const [computerChoice, setComputerChoice] = useState('');
  const [result, setResult] = useState('');

  useEffect(() => {
    if (window.Telegram.WebApp.initDataUnsafe.user) {
      setUsername(window.Telegram.WebApp.initDataUnsafe.user.username);
    }
  }, []);

  const getResult = (user, computer) => {
    if (user === computer) return "It's a draw!";
    if (
      (user === 'Scissors' && computer === 'Paper') ||
      (user === 'Paper' && computer === 'Stone') ||
      (user === 'Stone' && computer === 'Scissors')
    ) {
      return 'You win!';
    }
    return 'You lose!';
  };

  const handleChoice = (choice) => {
    setUserChoice(choice);
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    setComputerChoice(computerChoice);
    const result = getResult(choice, computerChoice);
    setResult(result);

    // Send result to Telegram
    const message = `@${username} chose ${choice}. Computer chose ${computerChoice}. ${result}`;
    window.Telegram.WebApp.sendData(message);
  };

  return (
    <div className="App">
      <h1>Scissors, Paper, Stone Game</h1>
      <p>Hi {username}! Please select your choice:</p>
      <div className="choices">
        {choices.map(choice => (
          <button key={choice} onClick={() => handleChoice(choice)}>
            {choice}
          </button>
        ))}
      </div>
      {userChoice && <p>You chose: {userChoice}</p>}
      {computerChoice && <p>Computer chose: {computerChoice}</p>}
      {result && <p>Result: {result}</p>}
      {result && <button onClick={() => setResult('')}>Try Again</button>}
    </div>
  );
}

export default App;
