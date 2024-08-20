// src/components/NavBar/NavBar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; // Add some basic styling

const NavBar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/wallet-details">Wallet Details</Link>
        </li>
        <li>
          <Link to="/">Games</Link>
        </li>
        <li>
          <Link to="/stats">Stats</Link>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
