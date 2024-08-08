import React, { useState, useEffect } from 'react';
import './App.css';

const choices = ["Scissors", "Paper", "Stone"];

function App() {
    const [username, setUsername] = useState('');
    const [userChoice, setUserChoice] = useState('');
    const [result, setResult] = useState('');

    useEffect(() => {
        if (window.Telegram.WebApp.initDataUnsafe.user) {
            setUsername(window.Telegram.WebApp.initDataUnsafe.user.username);
        }
    }, []);

    const handleChoice = async (choice) => {
        setUserChoice(choice);
        const response = await fetch(`https://your-server-url.com/play?username=${username}&choice=${choice}`);
        const resultText = await response.text();
        setResult(`You chose ${choice}. ${resultText}`);
        window.Telegram.WebApp.sendData(resultText);
    };

    return (
        <div className="App">
            <h1>Hi {username}! Please select your choice of item:</h1>
            <div className="choices">
                {choices.map(choice => (
                    <button key={choice} onClick={() => handleChoice(choice)}>
                        {choice}
                    </button>
                ))}
            </div>
            {result && <p>{result}</p>}
            <button onClick={() => setResult('')}>Try Again</button>
        </div>
    );
}

export default App;
