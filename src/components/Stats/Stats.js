import React, { useEffect, useState } from 'react';
import { performFetch } from '../utils/fetchUtils'; // Reuse the fetch function
import Stats from './components/Stats/Stats';
import './Stats.css';

const contractAddresses = {
  '0xA77241231a899b69725F2e2e092cf666286Ced7E': 'ShibWare',
  '0x43AB6e79a0ee99e6cF4eF9e70b4C0c2DF5A4d0Fb': 'CRYPTIQ',
};

function Stats({ userID }) {
  const [overallStats, setOverallStats] = useState({});
  const [gameLogs, setGameLogs] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await performFetch('/game_stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            user_id: userID,
          }),
        });

        setOverallStats(data.overallStats);
        setGameLogs(data.gameLogs);
      } catch (error) {
        console.error('Error fetching game stats:', error);
      }
    };

    fetchStats();
  }, [userID]);

  return (
    <div className="stats-container">
      <h2>Game Statistics</h2>
      <div className="stats-summary">
        <p><b>Total Matches:</b> {overallStats.total_matches || 0}</p>
        <p><b>Wins:</b> {overallStats.wins || 0}</p>
        <p><b>Losses:</b> {overallStats.losses || 0}</p>
      </div>

      <div className="game-logs">
        {gameLogs.length === 0 ? (
          <p>No game logs available.</p>
        ) : (
          gameLogs.map((log, index) => (
            <div className="log-card" key={index}>
              <p><b>Contract:</b> {contractAddresses[log.contract_address] || 'Unknown Contract'}</p>
              <p><b>Result:</b> {log.result === 'win' ? 'Win' : 'Loss'}</p>
              <p><b>Amount:</b> {parseFloat(log.amount) / Math.pow(10, 18)}</p>
              <p><b>Transaction:</b> <a href={`https://shibariumscan.io/tx/${log.txhash}`} target="_blank" rel="noopener noreferrer">View on Explorer</a></p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Stats;
