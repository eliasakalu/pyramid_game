// File: App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Create a BroadcastChannel for real-time communication
const gameChannel = new BroadcastChannel('pyramid_game_channel');

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<ProtectedAdminPanel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/player" element={<PlayerView />} />
      </Routes>
    </Router>
  );
}

// Login Component
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || 'admin@game.com';
    const adminPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    
    if (email === adminEmail && password === adminPassword) {
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('adminLoginTime', Date.now().toString());
      window.location.href = '/admin';
    } else {
      setError('Invalid credentials. Try: admin@game.com / admin123');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🎮 Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@game.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn">Login</button>
        </form>
        <div className="login-note">
          <p>Default: admin@game.com / admin123</p>
          <p>Or set REACT_APP_ADMIN_EMAIL and REACT_APP_ADMIN_PASSWORD in .env</p>
        </div>
      </div>
    </div>
  );
}

// Protected Admin Panel
function ProtectedAdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      // Check if login is within 12 hours
      if (isLoggedIn && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        if (timeDiff < 12 * 60 * 60 * 1000) { // 12 hours
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('isAdminLoggedIn');
          localStorage.removeItem('adminLoginTime');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      <button onClick={handleLogout} className="logout-btn">
        Logout
      </button>
      <AdminPanel />
    </div>
  );
}

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Admin Panel Component
function AdminPanel() {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem('pyramidGameTeams');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Team Red', score: 0, color: '#FF6B6B', isPlaying: true },
      { id: 2, name: 'Team Blue', score: 0, color: '#4D96FF', isPlaying: false },
      { id: 3, name: 'Team Green', score: 0, color: '#4CAF50', isPlaying: false }
    ];
  });
  
  const [boxes, setBoxes] = useState(() => {
    const saved = localStorage.getItem('pyramidGameBoxes');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        category: 'Movies',
        words: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter', 'Inception', 'The Matrix', 'Frozen'],
        color: '#FF6B6B',
        isCurrent: false,
        conqueredBy: null,
        points: 100
      },
      {
        id: 2,
        category: 'Animals',
        words: ['Lion', 'Elephant', 'Dolphin', 'Eagle', 'Penguin', 'Giraffe', 'Kangaroo'],
        color: '#4ECDC4',
        isCurrent: false,
        conqueredBy: null,
        points: 200
      },
      {
        id: 3,
        category: 'Countries',
        words: ['France', 'Japan', 'Brazil', 'Australia', 'Egypt', 'Canada', 'India'],
        color: '#45B7D1',
        isCurrent: false,
        conqueredBy: null,
        points: 300
      },
      {
        id: 4,
        category: 'Fruits',
        words: ['Apple', 'Banana', 'Orange', 'Grape', 'Strawberry', 'Watermelon', 'Pineapple'],
        color: '#96CEB4',
        isCurrent: false,
        conqueredBy: null,
        points: 100
      },
      {
        id: 5,
        category: 'Sports',
        words: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Golf', 'Baseball', 'Volleyball'],
        color: '#FFEAA7',
        isCurrent: false,
        conqueredBy: null,
        points: 200
      },
      {
        id: 6,
        category: 'Instruments',
        words: ['Guitar', 'Piano', 'Violin', 'Drums', 'Flute', 'Trumpet', 'Saxophone'],
        color: '#DDA0DD',
        isCurrent: false,
        conqueredBy: null,
        points: 300
      },
      {
        id: 7,
        category: 'Science',
        words: ['Physics', 'Chemistry', 'Biology', 'Astronomy', 'Geology', 'Mathematics', 'Computer'],
        color: '#98D8C8',
        isCurrent: false,
        conqueredBy: null,
        points: 500
      }
    ];
  });
  
  const [currentBox, setCurrentBox] = useState(() => {
    const saved = localStorage.getItem('pyramidGameCurrentBox');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [correctWords, setCorrectWords] = useState([]);
  const [skippedWords, setSkippedWords] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedBoxForWords, setSelectedBoxForWords] = useState(0);
  const [editingCategory, setEditingCategory] = useState(null);

  // Function to broadcast game state to all tabs - FIXED INFINITE LOOP
  const broadcastGameState = useCallback(() => {
    const gameState = {
      teams,
      boxes,
      currentBox,
      currentWordIndex,
      gameStarted,
      timer,
      isTimerRunning,
      correctWords,
      skippedWords,
      timestamp: Date.now()
    };
    gameChannel.postMessage({ type: 'GAME_STATE_UPDATE', payload: gameState });
    // Save to localStorage for persistence
    localStorage.setItem('pyramidGameState', JSON.stringify(gameState));
  }, [teams, boxes, currentBox, currentWordIndex, gameStarted, timer, isTimerRunning, correctWords, skippedWords]);

  // Save to localStorage and broadcast when state changes
  useEffect(() => {
    localStorage.setItem('pyramidGameTeams', JSON.stringify(teams));
    broadcastGameState();
  }, [teams, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameBoxes', JSON.stringify(boxes));
    broadcastGameState();
  }, [boxes, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameCurrentBox', JSON.stringify(currentBox));
    broadcastGameState();
  }, [currentBox, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameCurrentWordIndex', JSON.stringify(currentWordIndex));
    broadcastGameState();
  }, [currentWordIndex, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameStarted', JSON.stringify(gameStarted));
    broadcastGameState();
  }, [gameStarted, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameTimer', JSON.stringify(timer));
    broadcastGameState();
  }, [timer, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameCorrectWords', JSON.stringify(correctWords));
    broadcastGameState();
  }, [correctWords, broadcastGameState]);

  useEffect(() => {
    localStorage.setItem('pyramidGameSkippedWords', JSON.stringify(skippedWords));
    broadcastGameState();
  }, [skippedWords, broadcastGameState]);

  // Helper function to get current box object
  const getCurrentBox = () => {
    return boxes.find(b => b.id === currentBox);
  };

  // Timer - FIXED: Added proper cleanup
  useEffect(() => {
    let interval;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          const newTimer = prev - 1;
          if (newTimer <= 0) {
            clearInterval(interval);
            setIsTimerRunning(false);
            setGameStarted(false);
          }
          return newTimer;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timer]);

  // Start a box
  const startBox = (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    
    // Reset current boxes
    const updatedBoxes = boxes.map((box) => ({
      ...box,
      isCurrent: box.id === boxId
    }));
    
    setBoxes(updatedBoxes);
    setCurrentBox(box.id);
    setCurrentWordIndex(0);
    setCorrectWords([]);
    setSkippedWords([]);
    setTimer(30);
    setIsTimerRunning(false);
    setGameStarted(false);
  };

  // Start the game
  const startGame = () => {
    if (currentBox === null) {
      alert('Please select a box first!');
      return;
    }
    setGameStarted(true);
    setIsTimerRunning(true);
  };

  // Mark word as correct - FIXED: Round points to 2 decimal places
  const markCorrect = () => {
    if (!gameStarted || currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    const currentWord = currentBoxObj.words[currentWordIndex];
    setCorrectWords(prev => [...prev, currentWord]);
    
    // Update team score with rounded value
    const currentTeam = teams.find(t => t.isPlaying);
    if (currentTeam && currentBoxObj.words.length > 0) {
      const pointsPerWord = currentBoxObj.points / currentBoxObj.words.length;
      const roundedPoints = roundToTwo(pointsPerWord);
      
      setTeams(teams.map(team => 
        team.id === currentTeam.id 
          ? { ...team, score: roundToTwo(team.score + roundedPoints) }
          : team
      ));
    }
    
    nextWord();
  };

  // Skip word
  const skipWord = () => {
    if (!gameStarted || currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    const currentWord = currentBoxObj.words[currentWordIndex];
    setSkippedWords(prev => [...prev, currentWord]);
    
    nextWord();
  };

  // Next word - FIXED: Proper round ending
  const nextWord = () => {
    if (currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    if (currentWordIndex < currentBoxObj.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      endRound();
    }
  };

  // End round
  const endRound = () => {
    setIsTimerRunning(false);
    setGameStarted(false);
    // Don't reset current box here, let admin decide
  };

  // Switch to next team
  const switchToNextTeam = () => {
    const currentIndex = teams.findIndex(t => t.isPlaying);
    const nextIndex = (currentIndex + 1) % teams.length;
    
    setTeams(teams.map((team, index) => ({
      ...team,
      isPlaying: index === nextIndex
    })));
  };

  // Switch to specific team
  const switchToTeam = (teamId) => {
    setTeams(teams.map(team => ({
      ...team,
      isPlaying: team.id === teamId
    })));
  };

  // Add team
  const addTeam = () => {
    if (!newTeamName.trim() || teams.length >= 4) return;
    
    const colors = ['#FF6B6B', '#4D96FF', '#4CAF50', '#FFD700'];
    const newTeam = {
      id: teams.length + 1,
      name: newTeamName.trim(),
      score: 0,
      color: colors[teams.length],
      isPlaying: false
    };
    
    setTeams([...teams, newTeam]);
    setNewTeamName('');
  };

  // Remove team
  const removeTeam = (teamId) => {
    if (teams.length <= 2) return;
    const teamToRemove = teams.find(t => t.id === teamId);
    const wasPlaying = teamToRemove?.isPlaying;
    const newTeams = teams.filter(team => team.id !== teamId);
    
    // If we removed the current team, make the first team current
    if (wasPlaying && newTeams.length > 0) {
      newTeams[0].isPlaying = true;
    }
    
    setTeams(newTeams);
  };

  // Edit box category name
  const editBoxCategory = (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    
    setEditingCategory(boxId);
    setNewCategoryName(box.category);
  };

  // Save box category name
  const saveBoxCategory = (boxId) => {
    if (!newCategoryName.trim()) return;
    
    const updatedBoxes = boxes.map(box => 
      box.id === boxId 
        ? { ...box, category: newCategoryName.trim() }
        : box
    );
    
    setBoxes(updatedBoxes);
    setEditingCategory(null);
    setNewCategoryName('');
  };

  // Cancel editing category
  const cancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  // Add word to box
  const addWordToBox = (boxIndex) => {
    if (!newWord.trim()) return;
    
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].words.push(newWord.trim());
    setBoxes(updatedBoxes);
    setNewWord('');
  };

  // Remove word from box
  const removeWordFromBox = (boxIndex, wordIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].words.splice(wordIndex, 1);
    setBoxes(updatedBoxes);
  };

  // Conquer box for current team - FIXED: Round points
  const conquerBox = () => {
    const currentTeam = teams.find(t => t.isPlaying);
    if (!currentTeam || currentBox === null) return;
    
    const currentBoxIndex = boxes.findIndex(b => b.id === currentBox);
    if (currentBoxIndex === -1) return;
    
    const updatedBoxes = [...boxes];
    updatedBoxes[currentBoxIndex].conqueredBy = currentTeam.name;
    updatedBoxes[currentBoxIndex].isCurrent = false;
    
    // Award box points (rounded)
    setTeams(teams.map(team => 
      team.id === currentTeam.id 
        ? { ...team, score: roundToTwo(team.score + boxes[currentBoxIndex].points) }
        : team
    ));
    
    setBoxes(updatedBoxes);
    setCurrentBox(null);
    setGameStarted(false);
    setIsTimerRunning(false);
  };

  // Reset box
  const resetBox = (boxIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].conqueredBy = null;
    setBoxes(updatedBoxes);
  };

  // Reset entire game
  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the entire game? This will clear all scores and conquered boxes.')) {
      const resetTeams = [
        { id: 1, name: 'Team Red', score: 0, color: '#FF6B6B', isPlaying: true },
        { id: 2, name: 'Team Blue', score: 0, color: '#4D96FF', isPlaying: false },
        { id: 3, name: 'Team Green', score: 0, color: '#4CAF50', isPlaying: false }
      ];
      
      const resetBoxes = boxes.map(box => ({
        ...box,
        isCurrent: false,
        conqueredBy: null
      }));
      
      setTeams(resetTeams);
      setBoxes(resetBoxes);
      setCurrentBox(null);
      setCurrentWordIndex(0);
      setGameStarted(false);
      setIsTimerRunning(false);
      setTimer(30);
      setCorrectWords([]);
      setSkippedWords([]);
      
      // Clear localStorage
      localStorage.removeItem('pyramidGameTeams');
      localStorage.removeItem('pyramidGameBoxes');
      localStorage.removeItem('pyramidGameCurrentBox');
      localStorage.removeItem('pyramidGameCurrentWordIndex');
      localStorage.removeItem('pyramidGameStarted');
      localStorage.removeItem('pyramidGameTimer');
      localStorage.removeItem('pyramidGameCorrectWords');
      localStorage.removeItem('pyramidGameSkippedWords');
      localStorage.removeItem('pyramidGameState');
    }
  };

  // Get current team
  const currentTeam = teams.find(t => t.isPlaying);

  return (
    <div className="admin-panel">
      {/* Admin Header */}
      <div className="header">
        <h1>🎪 Betaliz Word Game - Admin Panel</h1>
        <div className="admin-status">
          <span className="status-indicator connected">🟢 Connected</span>
          <span className="player-count">👥 Players connected: {teams.length}</span>
        </div>
      </div>

      <div className="admin-grid">
        {/* Left Column: Teams & Game Control */}
        <div className="left-column">
          {/* Teams Management */}
          <div className="card">
            <h2>👥 Teams Management</h2>
            <div className="add-team">
              <input
                type="text"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="team-input"
              />
              <button onClick={addTeam} className="add-btn" disabled={teams.length >= 4}>
                + Add Team
              </button>
            </div>
            
            <div className="teams-list">
              {teams.map(team => (
                <div 
                  key={team.id} 
                  className={`team-card ${team.isPlaying ? 'active' : ''}`}
                  style={{ borderLeftColor: team.color }}
                >
                  <div className="team-info">
                    <div className="team-color" style={{ backgroundColor: team.color }} />
                    <div className="team-details">
                      <div className="team-name">{team.name}</div>
                      <div className="team-score">{team.score.toFixed(2)} points</div>
                    </div>
                    <div className="team-actions">
                      <button 
                        onClick={() => switchToTeam(team.id)}
                        className={`switch-btn ${team.isPlaying ? 'current' : ''}`}
                      >
                        {team.isPlaying ? '🎯 Current' : 'Set Active'}
                      </button>
                      <button 
                        onClick={() => removeTeam(team.id)}
                        className="remove-btn"
                        disabled={teams.length <= 2}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="team-quick-actions">
              <button onClick={switchToNextTeam} className="quick-btn">
                🔄 Switch to Next Team
              </button>
              <button 
                onClick={() => setTeams(teams.map(t => ({ ...t, score: 0 })))}
                className="quick-btn reset"
              >
                🔄 Reset All Scores
              </button>
              <button 
                onClick={resetGame}
                className="quick-btn danger"
              >
                ⚠️ Reset Entire Game
              </button>
            </div>
          </div>

          {/* Game Control */}
          <div className="card">
            <h2>🎮 Game Control</h2>
            <div className="game-controls">
              <div className="control-info">
                <div className="info-item">
                  <span className="label">Current Team:</span>
                  <span className="value" style={{ color: currentTeam?.color }}>
                    {currentTeam?.name || 'No team selected'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Current Box:</span>
                  <span className="value">
                    {currentBox !== null ? boxes.find(b => b.id === currentBox)?.category : 'No box selected'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Timer:</span>
                  <span className={`timer ${timer <= 10 ? 'warning' : ''}`}>
                    {timer}s
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Progress:</span>
                  <span className="value">
                    {correctWords.length} / {getCurrentBox()?.words?.length || 0} words
                  </span>
                </div>
              </div>
              
              <div className="control-buttons">
                <button 
                  onClick={startGame}
                  disabled={gameStarted || currentBox === null}
                  className="control-btn start-btn"
                >
                  ▶ Start Round
                </button>
                <button 
                  onClick={markCorrect}
                  disabled={!gameStarted}
                  className="control-btn correct-btn"
                >
                  ✓ Correct Guess
                </button>
                <button 
                  onClick={skipWord}
                  disabled={!gameStarted}
                  className="control-btn skip-btn"
                >
                  ⏭ Skip Word
                </button>
                <button 
                  onClick={conquerBox}
                  disabled={!gameStarted}
                  className="control-btn conquer-btn"
                >
                  🏆 Conquer Box
                </button>
                <button 
                  onClick={endRound}
                  className="control-btn end-btn"
                >
                  ⏹ End Round
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pyramid Boxes */}
        <div className="right-column">
          <div className="card">
            <h2>📦 Pyramid Boxes</h2>
            <div className="admin-pyramid">
              {/* Pyramid rows remain the same */}
              {/* Row 1: Box 1 */}
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[0]?.isCurrent ? 'current' : ''} ${boxes[0]?.conqueredBy ? 'conquered' : ''}`}
                  onClick={() => startBox(1)}
                  style={{ backgroundColor: boxes[0]?.conqueredBy ? '#aaa' : boxes[0]?.color }}
                >
                  {editingCategory === 1 ? (
                    <div className="category-edit-form">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="category-input"
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button onClick={() => saveBoxCategory(1)} className="save-btn">✓</button>
                        <button onClick={cancelEditCategory} className="cancel-btn">✗</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="box-number">1</div>
                      <div className="box-category">{boxes[0]?.category}</div>
                      <div className="box-points">{boxes[0]?.points} pts</div>
                      {boxes[0]?.conqueredBy && (
                        <div className="conquered-label">🏆 {boxes[0]?.conqueredBy}</div>
                      )}
                    </>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      editBoxCategory(1);
                    }}
                    className="edit-category-btn"
                    title="Edit category name"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              
              {/* Row 2: Box 2, 3 */}
              <div className="pyramid-row">
                {[1, 2].map(index => (
                  <div 
                    key={index}
                    className={`pyramid-box ${boxes[index]?.isCurrent ? 'current' : ''} ${boxes[index]?.conqueredBy ? 'conquered' : ''}`}
                    onClick={() => startBox(index + 1)}
                    style={{ backgroundColor: boxes[index]?.conqueredBy ? '#aaa' : boxes[index]?.color }}
                  >
                    {editingCategory === index + 1 ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="category-input"
                          autoFocus
                        />
                        <div className="edit-buttons">
                          <button onClick={() => saveBoxCategory(index + 1)} className="save-btn">✓</button>
                          <button onClick={cancelEditCategory} className="cancel-btn">✗</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="box-number">{index + 1}</div>
                        <div className="box-category">{boxes[index]?.category}</div>
                        <div className="box-points">{boxes[index]?.points} pts</div>
                        {boxes[index]?.conqueredBy && (
                          <div className="conquered-label">🏆 {boxes[index]?.conqueredBy}</div>
                        )}
                      </>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        editBoxCategory(index + 1);
                      }}
                      className="edit-category-btn"
                      title="Edit category name"
                    >
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Row 3: Box 4, 5, 6 */}
              <div className="pyramid-row">
                {[3, 4, 5].map(index => (
                  <div 
                    key={index}
                    className={`pyramid-box ${boxes[index]?.isCurrent ? 'current' : ''} ${boxes[index]?.conqueredBy ? 'conquered' : ''}`}
                    onClick={() => startBox(index + 1)}
                    style={{ backgroundColor: boxes[index]?.conqueredBy ? '#aaa' : boxes[index]?.color }}
                  >
                    {editingCategory === index + 1 ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="category-input"
                          autoFocus
                        />
                        <div className="edit-buttons">
                          <button onClick={() => saveBoxCategory(index + 1)} className="save-btn">✓</button>
                          <button onClick={cancelEditCategory} className="cancel-btn">✗</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="box-number">{index + 1}</div>
                        <div className="box-category">{boxes[index]?.category}</div>
                        <div className="box-points">{boxes[index]?.points} pts</div>
                        {boxes[index]?.conqueredBy && (
                          <div className="conquered-label">🏆 {boxes[index]?.conqueredBy}</div>
                        )}
                      </>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        editBoxCategory(index + 1);
                      }}
                      className="edit-category-btn"
                      title="Edit category name"
                    >
                      ✏️
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Row 4: Box 7 */}
              <div className="pyramid-row">
                <div 
                  className={`pyramid-box ${boxes[6]?.isCurrent ? 'current' : ''} ${boxes[6]?.conqueredBy ? 'conquered' : ''}`}
                  onClick={() => startBox(7)}
                  style={{ backgroundColor: boxes[6]?.conqueredBy ? '#aaa' : boxes[6]?.color }}
                >
                  {editingCategory === 7 ? (
                    <div className="category-edit-form">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="category-input"
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button onClick={() => saveBoxCategory(7)} className="save-btn">✓</button>
                        <button onClick={cancelEditCategory} className="cancel-btn">✗</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="box-number">7</div>
                      <div className="box-category">{boxes[6]?.category}</div>
                      <div className="box-points">{boxes[6]?.points} pts</div>
                      {boxes[6]?.conqueredBy && (
                        <div className="conquered-label">🏆 {boxes[6]?.conqueredBy}</div>
                      )}
                    </>
                  )}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      editBoxCategory(7);
                    }}
                    className="edit-category-btn"
                    title="Edit category name"
                  >
                    ✏️
                  </button>
                </div>
              </div>
            </div>

            {/* Words Management for Selected Box */}
            <div className="words-management">
              <h3>📝 Words for Box {selectedBoxForWords + 1}: {boxes[selectedBoxForWords]?.category}</h3>
              <div className="box-selector">
                {boxes.map((box, index) => (
                  <button
                    key={box.id}
                    onClick={() => setSelectedBoxForWords(index)}
                    className={`box-select-btn ${selectedBoxForWords === index ? 'active' : ''}`}
                    style={{ backgroundColor: box.color }}
                  >
                    Box {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="words-list">
                {boxes[selectedBoxForWords]?.words.map((word, wordIndex) => (
                  <div key={wordIndex} className="word-tag">
                    <span className="word-number">{wordIndex + 1}</span>
                    {word}
                    <button 
                      onClick={() => removeWordFromBox(selectedBoxForWords, wordIndex)}
                      className="remove-word"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="add-word">
                <input
                  type="text"
                  placeholder="Add new word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="word-input"
                />
                <button 
                  onClick={() => addWordToBox(selectedBoxForWords)}
                  className="add-word-btn"
                >
                  Add Word
                </button>
              </div>
              
              {boxes[selectedBoxForWords]?.conqueredBy && (
                <button 
                  onClick={() => resetBox(selectedBoxForWords)}
                  className="reset-box-btn"
                >
                  🔄 Reset This Box
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Player View Component - Updated with better sync
function PlayerView() {
  const [gameState, setGameState] = useState(() => {
    const saved = localStorage.getItem('pyramidGameState');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [wordDisplayStyle, setWordDisplayStyle] = useState('one-by-one');
  const [isConnected, setIsConnected] = useState(true);

  // Listen for real-time updates from the admin panel
  useEffect(() => {
    const channel = new BroadcastChannel('pyramid_game_channel');
    
    const handleMessage = (event) => {
      if (event.data.type === 'GAME_STATE_UPDATE') {
        setGameState(event.data.payload);
        setIsConnected(true);
      }
    };
    
    channel.addEventListener('message', handleMessage);
    
    // Check connection status periodically
    const connectionCheck = setInterval(() => {
      if (!gameState || Date.now() - gameState.timestamp > 3000) {
        setIsConnected(false);
      } else {
        setIsConnected(true);
      }
    }, 1000);
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      clearInterval(connectionCheck);
    };
  }, [gameState]);

  // If no game state yet, show loading
  if (!gameState) {
    return (
      <div className="player-view">
        <div className="waiting-screen">
          <div className="waiting-icon">🔄</div>
          <h3>Waiting for Game Setup...</h3>
          <p>Please open the admin panel in another tab to start the game.</p>
          <p>Admin URL: <code>{window.location.origin}/admin</code></p>
        </div>
      </div>
    );
  }

  const { 
    teams = [], 
    boxes = [], 
    currentBox, 
    gameStarted, 
    timer, 
    currentWordIndex,
    correctWords = [],
    skippedWords = [] 
  } = gameState;

  // Get current team
  const currentTeam = teams.find(t => t.isPlaying);
  
  // Get current box object
  const getCurrentBox = () => {
    return boxes.find(b => b.id === currentBox);
  };

  return (
    <div className="player-view">
      {/* Connection Status */}
      {!isConnected && (
        <div className="connection-status">
          ⚠️ Disconnected from Admin Panel
        </div>
      )}
      
      {/* Player Header */}
      <div className="player-header">
        <h2>🎮 Player Screen - Clue Giver</h2>
        <div className="player-info">
          <div className="info-card">
            <div className="label">Your Team:</div>
            <div className="value" style={{ color: currentTeam?.color }}>
              {currentTeam?.name}
            </div>
          </div>
          <div className="info-card">
            <div className="label">Time Left:</div>
            <div className={`timer ${timer <= 10 ? 'warning' : ''}`}>
              {timer} seconds
            </div>
          </div>
          <div className="info-card">
            <div className="label">Words Guessed:</div>
            <div className="value">{correctWords.length}</div>
          </div>
          <div className="info-card">
            <div className="label">Team Score:</div>
            <div className="value">{currentTeam?.score?.toFixed(2) || '0.00'} pts</div>
          </div>
        </div>
      </div>
      
      <div className="player-content">
        {/* Left: Pyramid View */}
        <div className="player-pyramid-section">
          <h3>📦 Pyramid Boxes</h3>
          <div className="player-pyramid">
            {/* Pyramid rows remain the same */}
            {/* Row 1: Box 1 */}
            <div className="pyramid-row">
              <div 
                className={`player-pyramid-box ${boxes[0]?.isCurrent ? 'current' : ''} ${boxes[0]?.conqueredBy ? 'conquered' : ''}`}
                style={{ 
                  backgroundColor: boxes[0]?.conqueredBy ? '#666' : boxes[0]?.color,
                  opacity: boxes[0]?.conqueredBy ? 0.7 : 1
                }}
              >
                <div className="box-number">1</div>
                <div className="box-category">{boxes[0]?.category}</div>
                <div className="box-points">{boxes[0]?.points} pts</div>
                {boxes[0]?.isCurrent && <div className="current-indicator">🎯 Playing</div>}
                {boxes[0]?.conqueredBy && <div className="conquered-label">🏆 {boxes[0]?.conqueredBy}</div>}
              </div>
            </div>
            
            {/* Row 2: Box 2, 3 */}
            <div className="pyramid-row">
              {[1, 2].map(index => (
                <div 
                  key={index}
                  className={`player-pyramid-box ${boxes[index]?.isCurrent ? 'current' : ''} ${boxes[index]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ 
                    backgroundColor: boxes[index]?.conqueredBy ? '#666' : boxes[index]?.color,
                    opacity: boxes[index]?.conqueredBy ? 0.7 : 1
                  }}
                >
                  <div className="box-number">{index + 1}</div>
                  <div className="box-category">{boxes[index]?.category}</div>
                  <div className="box-points">{boxes[index]?.points} pts</div>
                  {boxes[index]?.isCurrent && <div className="current-indicator">🎯 Playing</div>}
                  {boxes[index]?.conqueredBy && <div className="conquered-label">🏆 {boxes[index]?.conqueredBy}</div>}
                </div>
              ))}
            </div>
            
            {/* Row 3: Box 4, 5, 6 */}
            <div className="pyramid-row">
              {[3, 4, 5].map(index => (
                <div 
                  key={index}
                  className={`player-pyramid-box ${boxes[index]?.isCurrent ? 'current' : ''} ${boxes[index]?.conqueredBy ? 'conquered' : ''}`}
                  style={{ 
                    backgroundColor: boxes[index]?.conqueredBy ? '#666' : boxes[index]?.color,
                    opacity: boxes[index]?.conqueredBy ? 0.7 : 1
                  }}
                >
                  <div className="box-number">{index + 1}</div>
                  <div className="box-category">{boxes[index]?.category}</div>
                  <div className="box-points">{boxes[index]?.points} pts</div>
                  {boxes[index]?.isCurrent && <div className="current-indicator">🎯 Playing</div>}
                  {boxes[index]?.conqueredBy && <div className="conquered-label">🏆 {boxes[index]?.conqueredBy}</div>}
                </div>
              ))}
            </div>
            
            {/* Row 4: Box 7 */}
            <div className="pyramid-row">
              <div 
                className={`player-pyramid-box ${boxes[6]?.isCurrent ? 'current' : ''} ${boxes[6]?.conqueredBy ? 'conquered' : ''}`}
                style={{ 
                  backgroundColor: boxes[6]?.conqueredBy ? '#666' : boxes[6]?.color,
                  opacity: boxes[6]?.conqueredBy ? 0.7 : 1
                }}
              >
                <div className="box-number">7</div>
                <div className="box-category">{boxes[6]?.category}</div>
                <div className="box-points">{boxes[6]?.points} pts</div>
                {boxes[6]?.isCurrent && <div className="current-indicator">🎯 Playing</div>}
                {boxes[6]?.conqueredBy && <div className="conquered-label">🏆 {boxes[6]?.conqueredBy}</div>}
              </div>
            </div>
          </div>
          
          {/* Current Box Info */}
          {currentBox !== null && (
            <div className="current-box-info">
              <h4>Current Box: {boxes.find(b => b.id === currentBox)?.category}</h4>
              <p>Words to guess: {boxes.find(b => b.id === currentBox)?.words?.length}</p>
              <p>Points: {boxes.find(b => b.id === currentBox)?.points}</p>
            </div>
          )}
        </div>
        
        {/* Right: Word Display */}
        <div className="word-display-section">
          {!gameStarted ? (
            <div className="waiting-screen">
              <div className="waiting-icon">⏳</div>
              <h3>Waiting for Admin to Start Round</h3>
              <p>When the round starts, words will appear here one by one.</p>
              <div className="instructions">
                <p><strong>🎯 Instructions for Clue Giver:</strong></p>
                <p>1. Describe each word WITHOUT saying the actual word</p>
                <p>2. Your teammate must guess based on your clues</p>
                <p>3. Admin will mark correct answers</p>
                <p>4. Get as many as possible in 30 seconds!</p>
              </div>
            </div>
          ) : (
            <div className="active-game">
              <div className="word-display-header">
                <h3>Describe this word to your teammate:</h3>
                <div className="word-progress">
                  Word {currentWordIndex + 1} of {getCurrentBox()?.words?.length}
                </div>
              </div>
              
              <div className="word-display-main">
                {wordDisplayStyle === 'flashcard' ? (
                  <div className="flashcard">
                    <div className="flashcard-front">
                      {getCurrentBox()?.words[currentWordIndex]}
                    </div>
                  </div>
                ) : (
                  <div className="word-slide">
                    <div className="current-word">
                      {getCurrentBox()?.words[currentWordIndex]}
                    </div>
                    <div className="word-countdown">
                      {timer}s left
                    </div>
                  </div>
                )}
                
                <div className="display-style-toggle">
                  <button
                    onClick={() => setWordDisplayStyle('one-by-one')}
                    className={`style-btn ${wordDisplayStyle === 'one-by-one' ? 'active' : ''}`}
                  >
                    📱 One by One
                  </button>
                  <button
                    onClick={() => setWordDisplayStyle('flashcard')}
                    className={`style-btn ${wordDisplayStyle === 'flashcard' ? 'active' : ''}`}
                  >
                    🃏 Flashcard
                  </button>
                </div>
              </div>
              
              <div className="game-stats">
                <div className="stats-grid">
                  <div className="stat">
                    <div className="stat-label">Correct:</div>
                    <div className="stat-value correct">{correctWords.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Skipped:</div>
                    <div className="stat-value skipped">{skippedWords.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Remaining:</div>
                    <div className="stat-value">
                      {getCurrentBox()?.words?.length - correctWords.length - skippedWords.length}
                    </div>
                  </div>
                </div>
                
                <div className="recent-words">
                  <h4>Recently Guessed:</h4>
                  <div className="words-list">
                    {correctWords.slice(-3).reverse().map((word, idx) => (
                      <div key={idx} className="correct-word-tag">✓ {word}</div>
                    ))}
                    {skippedWords.slice(-3).reverse().map((word, idx) => (
                      <div key={idx} className="skipped-word-tag">⏭ {word}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Scoreboard */}
      <div className="scoreboard">
        <h3>🏆 Live Scoreboard</h3>
        <div className="teams-scoreboard">
          {teams.map(team => (
            <div 
              key={team.id} 
              className={`scoreboard-team ${team.isPlaying ? 'active' : ''}`}
              style={{ borderColor: team.color }}
            >
              <div className="scoreboard-team-info">
                <div className="team-dot" style={{ backgroundColor: team.color }} />
                <div className="team-name">{team.name}</div>
                {team.isPlaying && <div className="playing-indicator">🎯 PLAYING</div>}
              </div>
              <div className="team-score">{team.score?.toFixed(2) || '0.00'} points</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;