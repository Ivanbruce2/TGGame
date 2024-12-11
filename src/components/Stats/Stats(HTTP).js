import React, { useEffect, useState } from 'react';
import './Stats.css';

function Stats({ userID, backendURL, contractAddresses }) {
  const [overallStats, setOverallStats] = useState(null);
  const [gameLogs, setGameLogs] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [view, setView] = useState('history'); // State to manage the toggle view

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${backendURL}/game_stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: userID }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setOverallStats(data.overallStats);
        setGameLogs(data.gameLogs);
      } catch (error) {
        console.error('Error fetching game stats:', error);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${backendURL}/leaderboard`, {
          method: 'GET',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      }
    };

    fetchStats();
    if (view === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [userID, view]);

  const getTokenSymbol = (address) => {
    const token = contractAddresses.find((contract) => contract.address === address);
    return token ? token.symbol : address;
  };

  const getFormattedAmount = (amount, address) => {
    const token = contractAddresses.find((contract) => contract.address === address);
    const decimals = token ? token.decimals : 1;
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2);
  };

  return (
    <div className="stats-container">
      <h2>Game Stats</h2>
      {overallStats && (
        <div className="overall-stats">
          <div className="stats-row">
            <span>Total Matches</span>
            <span>Wins</span>
            <span>Losses</span>
          </div>
          <div className="stats-row">
            <span>{overallStats.total_matches}</span>
            <span>{overallStats.wins}</span>
            <span>{overallStats.losses}</span>
          </div>
        </div>
      )}

      <div className="toggle-buttons">
        <button
          className={`toggle-button ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          Game History
        </button>
        <button
          className={`toggle-button ${view === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setView('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {view === 'history' ? (
        <div className="game-history">
          <h3>Game History</h3>
          <div className="game-logs">
            <table className="game-log-table">
              <thead>
                <tr>
                  <th>Contract</th>
                  <th>Result</th>
                  <th>Amount</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {gameLogs && gameLogs.map((log, index) => (
                  <tr key={index}>
                    <td>{getTokenSymbol(log.contract_address)}</td>
                    <td className={log.result === 'win' ? 'result-win' : 'result-lose'}>
                      {log.result}
                    </td>
                    <td>{getFormattedAmount(log.amount, log.contract_address)}</td>
                    <td>
                      <a
                        href={`https://shibariumscan.io/tx/${log.txhash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Transaction
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="leaderboard">
          <h3>Leaderboard</h3>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Username</th>
                <th>Wins</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard && leaderboard.map((player, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{player.username}</td>
                  <td>{player.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Stats;
