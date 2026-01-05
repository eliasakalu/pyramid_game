import React, { useState, useEffect } from 'react';
import './PyramidGame.css';

const PyramidGame = () => {
  // Game mode: 'admin' or 'player'
  const [mode, setMode] = useState('admin');
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  
  // Teams
  const [teams, setTeams] = useState([
    { id: 1, name: 'Team Red', color: '#FF6B6B', score: 0, isCurrent: true },
    { id: 2, name: 'Team Blue', color: '#4D96FF', score: 0, isCurrent: false }
  ]);
  
  // Pyramid boxes (7 boxes)
  const [boxes, setBoxes] = useState([
    {
      id: 1,
      title: 'Movies',
      color: '#FF6B6B',
      words: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Inception'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 2,
      title: 'Animals',
      color: '#4ECDC4',
      words: ['Lion', 'Elephant', 'Dolphin', 'Eagle', 'Penguin'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 3,
      title: 'Countries',
      color: '#45B7D1',
      words: ['France', 'Japan', 'Brazil', 'Australia', 'Egypt'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 4,
      title: 'Fruits',
      color: '#96CEB4',
      words: ['Apple', 'Banana', 'Orange', 'Grape', 'Strawberry'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 5,
      title: 'Sports',
      color: '#FFEAA7',
      words: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Golf'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 6,
      title: 'Instruments',
      color: '#DDA0DD',
      words: ['Guitar', 'Piano', 'Violin', 'Drums', 'Flute'],
      conqueredBy: null,
      isCurrent: false
    },
    {
      id: 7,
      title: 'Science',
      color: '#98D8C8',
      words: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Geology'],
      conqueredBy: null,
      isCurrent: false
    }
  ]);
  
  // Current game
  const [currentBox, setCurrentBox] = useState(0);
  const [revealedWords, setRevealedWords] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  
  // Timer effect
  useEffect(() => {
    let interval;
    if (timerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerRunning(false);
      endTurn();
    }
    return () => clearInterval(interval);
  }, [timerRunning, timer]);

  // Start game with a box
  const startGame = (boxIndex) => {
    setCurrentBox(boxIndex);
    setRevealedWords([]);
    setTimer(30);
    setTimerRunning(false);
    
    const updatedBoxes = boxes.map((box, index) => ({
      ...box,
      isCurrent: index === boxIndex
    }));
    setBoxes(updatedBoxes);
    
    setGameStarted(true);
  };

  // Mark word as correct
  const markCorrect = (wordIndex) => {
    if (!timerRunning) return;
    
    setRevealedWords(prev => [...prev, wordIndex]);
    
    // Add points
    const currentTeam = teams.find(t => t.isCurrent);
    if (currentTeam) {
      const points = 100;
      setTeams(prev => prev.map(team => 
        team.id === currentTeam.id 
          ? { ...team, score: team.score + points }
          : team
      ));
    }
  };

  // End current turn
  const endTurn = () => {
    setTimerRunning(false);
    
    // Switch team
    setTeams(prev => prev.map(team => ({
      ...team,
      isCurrent: !team.isCurrent
    })));
    
    // Reset revealed words
    setRevealedWords([]);
  };

  // Conquer box for current team
  const conquerBox = () => {
    const currentTeam = teams.find(t => t.isCurrent);
    if (!currentTeam) return;
    
    const updatedBoxes = boxes.map((box, index) => 
      index === currentBox 
        ? { ...box, conqueredBy: currentTeam.name, isCurrent: false }
        : box
    );
    
    setBoxes(updatedBoxes);
    endTurn();
    setGameStarted(false);
  };

  // Add team
  const addTeam = () => {
    if (!newTeamName.trim() || teams.length >= 4) return;
    
    const colors = ['#FF6B6B', '#4D96FF', '#FFD166', '#06D6A0'];
    const newTeam = {
      id: teams.length + 1,
      name: newTeamName.trim(),
      color: colors[teams.length],
      score: 0,
      isCurrent: false
    };
    
    setTeams([...teams, newTeam]);
    setNewTeamName('');
  };

  // Add word to box
  const addWord = (boxIndex, word) => {
    if (!word.trim()) return;
    
    const updatedBoxes = boxes.map((box, index) => 
      index === boxIndex
        ? { ...box, words: [...box.words, word.trim()] }
        : box
    );
    
    setBoxes(updatedBoxes);
  };

  // Reset box
  const resetBox = (boxIndex) => {
    const updatedBoxes = boxes.map((box, index) => 
      index === boxIndex
        ? { ...box, conqueredBy: null }
        : box
    );
    
    setBoxes(updatedBoxes);
  };

  return (
    <div className="pyramid-app">
      {/* Header */}
      <div className="header">
        <h1>🎪 Pyramid Game</h1>
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'admin' ? 'active' : ''}`}
            onClick={() => setMode('admin')}
          >
            👑 Admin Panel
          </button>
          <button 
            className={`mode-btn ${mode === 'player' ? 'active' : ''}`}
            onClick={() => setMode('player')}
          >
            👁️ Player View
          </button>
        </div>
      </div>

      {mode === 'admin' ? (
        /* ADMIN PANEL */
        <div className="admin-panel">
          {/* Teams Section */}
          <div className="section">
            <h2 className="section-title">👥 Teams</h2>
            <div className="teams-setup">
              <div className="add-team">
                <input
                  type="text"
                  className="team-input"
                  placeholder="Team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
                <button className="add-btn" onClick={addTeam}>
                  + Add Team
                </button>
              </div>
              
              <div className="teams-list">
                {teams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-header">
                      <div 
                        className="team-color" 
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="team-name">{team.name}</span>
                      <span className="team-score">{team.score} pts</span>
                    </div>
                    <div className="team-status">
                      {team.isCurrent ? '🎯 CURRENT' : 'Waiting...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pyramid Boxes */}
          <div className="section">
            <h2 className="section-title">📦 Pyramid Boxes</h2>
            <div className="boxes-grid">
              {boxes.map((box, index) => (
                <div key={box.id} className="box-card">
                  <div className="box-header">
                    <div 
                      className="box-color"
                      style={{ backgroundColor: box.color }}
                    />
                    <span className="box-title">Box {index + 1}: {box.title}</span>
                    {box.conqueredBy && (
                      <span className="conquered-badge">🏆 {box.conqueredBy}</span>
                    )}
                  </div>
                  
                  <div className="box-words">
                    {box.words.map((word, wordIndex) => (
                      <div key={wordIndex} className="word-item">
                        {word}
                      </div>
                    ))}
                  </div>
                  
                  <div className="box-actions">
                    <button 
                      className="action-btn select"
                      onClick={() => startGame(index)}
                      disabled={box.conqueredBy || gameStarted}
                    >
                      🎯 Select Box
                    </button>
                    {box.conqueredBy && (
                      <button 
                        className="action-btn reset"
                        onClick={() => resetBox(index)}
                      >
                        🔄 Reset
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Controls */}
          <div className="section">
            <h2 className="section-title">🎮 Game Controls</h2>
            <div className="game-controls">
              <div className="control-display">
                <div className="current-box">
                  Current Box: {boxes[currentBox]?.title || 'None'}
                </div>
                <div className="timer-display">
                  ⏱️ Timer: {timer}s
                </div>
                <div className="current-team">
                  Current Team: {teams.find(t => t.isCurrent)?.name || 'None'}
                </div>
              </div>
              
              <div className="control-buttons">
                {!timerRunning ? (
                  <button 
                    className="control-btn start"
                    onClick={() => setTimerRunning(true)}
                    disabled={!gameStarted}
                  >
                    ▶ Start Timer
                  </button>
                ) : (
                  <button 
                    className="control-btn pause"
                    onClick={() => setTimerRunning(false)}
                  >
                    ⏸ Pause Timer
                  </button>
                )}
                
                <button 
                  className="control-btn next"
                  onClick={endTurn}
                >
                  ⏭ Next Team
                </button>
                
                <button 
                  className="control-btn conquer"
                  onClick={conquerBox}
                  disabled={!gameStarted}
                >
                  🏆 Conquer Box
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* PLAYER VIEW */
        <div className="player-view">
          <div className="player-header">
            <h2>🎯 Player Screen</h2>
            <div className="game-info">
              <div className="info-item">
                <span className="label">Current Team:</span>
                <span className="value" style={{ color: teams.find(t => t.isCurrent)?.color }}>
                  {teams.find(t => t.isCurrent)?.name}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Timer:</span>
                <span className={`timer ${timer <= 10 ? 'warning' : ''}`}>
                  {timer}s
                </span>
              </div>
              <div className="info-item">
                <span className="label">Current Box:</span>
                <span className="value">{boxes[currentBox]?.title}</span>
              </div>
            </div>
          </div>

          {/* Words Display */}
          <div className="words-display">
            <h3>Words to Guess:</h3>
            <div className="words-grid">
              {boxes[currentBox]?.words.map((word, index) => (
                <div 
                  key={index}
                  className={`word-card ${revealedWords.includes(index) ? 'revealed' : ''}`}
                >
                  <span className="word-number">{index + 1}</span>
                  <span className="word-text">
                    {revealedWords.includes(index) ? word : '?????'}
                  </span>
                  <span className="word-status">
                    {revealedWords.includes(index) ? '✓ Guessed' : '❓ Hidden'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="instructions">
              <p>📢 <strong>Instructions:</strong> Describe these words without saying them!</p>
              <p>Admin will mark correct guesses. Get as many as you can in 30 seconds!</p>
            </div>
          </div>

          {/* Pyramid View */}
          <div className="pyramid-view">
            <h3>Pyramid</h3>
            <div className="pyramid">
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[0]?.isCurrent ? 'current' : ''} ${boxes[0]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[0]?.color }}
                >
                  <span className="box-num">1</span>
                  <span className="box-title">{boxes[0]?.title}</span>
                </div>
              </div>
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[1]?.isCurrent ? 'current' : ''} ${boxes[1]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[1]?.color }}
                >
                  <span className="box-num">2</span>
                  <span className="box-title">{boxes[1]?.title}</span>
                </div>
                <div 
                  className={`pyramid-box ${boxes[2]?.isCurrent ? 'current' : ''} ${boxes[2]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[2]?.color }}
                >
                  <span className="box-num">3</span>
                  <span className="box-title">{boxes[2]?.title}</span>
                </div>
              </div>
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[3]?.isCurrent ? 'current' : ''} ${boxes[3]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[3]?.color }}
                >
                  <span className="box-num">4</span>
                  <span className="box-title">{boxes[3]?.title}</span>
                </div>
                <div 
                  className={`pyramid-box ${boxes[4]?.isCurrent ? 'current' : ''} ${boxes[4]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[4]?.color }}
                >
                  <span className="box-num">5</span>
                  <span className="box-title">{boxes[4]?.title}</span>
                </div>
                <div 
                  className={`pyramid-box ${boxes[5]?.isCurrent ? 'current' : ''} ${boxes[5]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[5]?.color }}
                >
                  <span className="box-num">6</span>
                  <span className="box-title">{boxes[5]?.title}</span>
                </div>
              </div>
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[6]?.isCurrent ? 'current' : ''} ${boxes[6]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ backgroundColor: boxes[6]?.color }}
                >
                  <span className="box-num">7</span>
                  <span className="box-title">{boxes[6]?.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="scores">
            <h3>🏆 Scores</h3>
            <div className="scores-grid">
              {teams.map(team => (
                <div key={team.id} className="score-card">
                  <div 
                    className="score-team" 
                    style={{ color: team.color }}
                  >
                    {team.name}
                  </div>
                  <div className="score-value">{team.score} pts</div>
                  {team.isCurrent && <div className="current-badge">🎯 Playing</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PyramidGame;