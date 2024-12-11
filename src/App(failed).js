import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function App() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    console.log('Attempting to connect to the server...');
    const newSocket = io('http://localhost:8000', {
      transports: ['websocket'], // Force WebSocket transport
    });

    // Log the socket instance for debugging
    console.log('Socket instance:', newSocket);

    // Set the socket in state
    setSocket(newSocket);

    // Handle connection success
    newSocket.on('connect', () => {
      console.log('Connected to the server with ID:', newSocket.id);
    });

    // Handle connection errors
    newSocket.on('connect_error', (error) => {
      console.error('Connection Error:', error.message);
    });

    // Handle disconnection
    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from the server. Reason:', reason);
    });

    // Handle incoming messages
    newSocket.on('reply', (data) => {
      console.log('Received reply from server:', data);
      setResponse(data);
    });

    // Cleanup on component unmount
    return () => {
      console.log('Disconnecting from the server...');
      newSocket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (socket) {
      console.log('Sending message:', message);
      socket.emit('message', message);
      setMessage(''); // Clear input field
    }
  };

  return (
    <div>
      <h1>WebSocket Chat</h1>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message"
      />
      <button onClick={sendMessage}>Send</button>
      <p>Response from server: {response}</p>
    </div>
  );
}

export default App;
