import React, { useEffect } from 'react';
import './Stats.css';

function Stats({ overallStats, gameLogs, leaderboard, view, setView, contractAddresses, fetchGameStats, fetchLeaderboard }) {
  const getTokenSymbol = (address) => {
    const token = contractAddresses.find((contract) => contract.address === address);
    return token ? token.symbol : address;
  };

  const getFormattedAmount = (amount, address) => {
    const token = contractAddresses.find((contract) => contract.address === address);
    const decimals = token ? token.decimals : 1;
    return (parseFloat(amount) / Math.pow(10, decimals)).toFixed(2);
  };

  useEffect(() => {
    // Fetch the initial data when the component is mounted
    if (view === 'history') {
      fetchGameStats();
    } else if (view === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [view, fetchGameStats, fetchLeaderboard]); 

  return (
    <div className="stats-container">
      <h2>GAME STATS</h2>
      {overallStats && (
        <div className="overall-stats">
          <div className="stats-row">
            <span>Overall</span>
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

      {/* Toggle Buttons */}
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

      {/* Conditional Rendering based on the selected view */}
      {view === 'history' ? (
        <div className="game-history">
          <div className="game-logs">
            <table className="game-log-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Amount</th>
                  <th>Result</th>
                  <th>Your Choice</th>
                  <th>Opponent</th>
                  <th>Opponent's Choice</th>
                </tr>
              </thead>
              <tbody>
                {gameLogs && gameLogs.map((log, index) => (
                  <tr key={index}>
                    <td>{getTokenSymbol(log.contract_address)}</td>
                    <td>{getFormattedAmount(log.amount, log.contract_address)}</td>
                    <td className={log.result === 'win' ? 'result-win' : 'result-lose'}>
                      <a
                        href={`https://shibariumscan.io/tx/${log.txhash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={log.result === 'win' ? 'result-win' : 'result-lose'}
                      >
                        {log.result}
                      </a>
                    </td>
                    <td>{log.your_choice}</td> {/* Your choice */}
                    <td>{log.opponent_username}</td> {/* Opponent's username */}
                    <td>{log.opponent_choice}</td> {/* Opponent's choice */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="leaderboard">
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
