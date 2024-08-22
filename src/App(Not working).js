import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function SocketIOExample() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const socket = io('http://localhost:8080', {
    transports: ['websocket'], // Force WebSocket transport
    withCredentials: true, // Enable credentials if needed
  });

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('reply', (data) => {
      setResponse(data);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      socket.disconnect(); // Clean up when the component is unmounted
    };
  }, []);

  const sendMessage = () => {
    socket.emit('message', message);
    setMessage(''); // Clear the input
  };

  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button onClick={sendMessage}>Send</button>
      <p>Response from server: {response}</p>
    </div>
  );
}

export default SocketIOExample;
