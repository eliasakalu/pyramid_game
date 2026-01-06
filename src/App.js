// App.js - Complete Socket.io Version with Your CSS
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';

// Socket.io connection URL - Change this to your Railway backend URL
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// Default game data
const defaultTeams = [
  { id: 1, name: 'Team Red', score: 0, color: '#FF6B6B', isPlaying: true },
  { id: 2, name: 'Team Blue', score: 0, color: '#4D96FF', isPlaying: false }
];

const defaultBoxes = [
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

// Helper function
const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// Main App Component
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminPanel />} />
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
      </div>
    </div>
  );
}

// Socket.io Hook
const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', newSocket.id);
      setIsConnected(true);
      setConnectionError('');
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError('Failed to connect to game server');
    });

    newSocket.on('reconnect', () => {
      console.log('🔄 Reconnected to server');
      setIsConnected(true);
      setConnectionError('');
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  return { socket, isConnected, connectionError };
};

// Admin Panel Component
function AdminPanel() {
  const [teams, setTeams] = useState(defaultTeams);
  const [boxes, setBoxes] = useState(defaultBoxes);
  const [currentBox, setCurrentBox] = useState(null);
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTeamScore, setEditingTeamScore] = useState(null);
  const [tempTeamScore, setTempTeamScore] = useState('');
  const timerIntervalRef = useRef(null);
  
  const { socket, isConnected, connectionError } = useSocket();

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (isLoggedIn && loginTime) {
        const timeDiff = Date.now() - parseInt(loginTime);
        if (timeDiff < 12 * 60 * 60 * 1000) {
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

  // Register as admin when socket connects
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('register-client', { type: 'admin' });
    }
  }, [socket, isConnected]);

  // Listen for game state updates
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (state) => {
      setTeams(state.teams || defaultTeams);
      setBoxes(state.boxes || defaultBoxes);
      setCurrentBox(state.currentBox || null);
      setCurrentWordIndex(state.currentWordIndex || 0);
      setGameStarted(state.gameStarted || false);
      setTimer(state.timer || 30);
      setIsTimerRunning(state.isTimerRunning || false);
      setCorrectWords(state.correctWords || []);
      setSkippedWords(state.skippedWords || []);
    };

    const handleTimerUpdate = (newTimer) => {
      setTimer(newTimer);
    };

    const handleWordCorrect = (data) => {
      setCorrectWords(data.correctWords || []);
    };

    const handleWordSkipped = (data) => {
      setSkippedWords(data.skippedWords || []);
    };

    socket.on('game-state', handleGameState);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('word-correct', handleWordCorrect);
    socket.on('word-skipped', handleWordSkipped);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('word-correct', handleWordCorrect);
      socket.off('word-skipped', handleWordSkipped);
    };
  }, [socket]);

  // Timer effect
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (isTimerRunning && timer > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimer(prevTimer => {
          const newTimer = prevTimer - 1;
          if (newTimer <= 0) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            setGameStarted(false);
          }
          return newTimer;
        });
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timer]);

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = '/login';
  };

  // Helper functions
  const getCurrentBox = () => boxes.find(b => b.id === currentBox);
  const currentTeam = teams.find(t => t.isPlaying);

  // Game control functions
  const startBox = (boxId) => {
    if (socket && isConnected) {
      socket.emit('start-box', boxId);
    } else {
      alert('Not connected to server');
    }
  };

  const startGame = () => {
    if (socket && isConnected) {
      if (!currentBox) {
        alert('Please select a box first!');
        return;
      }
      socket.emit('start-game');
    } else {
      alert('Not connected to server');
    }
  };

  const markCorrect = () => {
    if (socket && isConnected) {
      socket.emit('mark-correct');
    }
  };

  const skipWord = () => {
    if (socket && isConnected) {
      socket.emit('skip-word');
    }
  };

  const nextWord = () => {
    if (socket && isConnected) {
      socket.emit('next-word');
    }
  };

  const conquerBox = () => {
    if (socket && isConnected) {
      socket.emit('conquer-box');
    }
  };

  const endRound = () => {
    if (socket && isConnected) {
      socket.emit('end-round');
    }
  };

  const switchToNextTeam = () => {
    if (socket && isConnected) {
      socket.emit('switch-team');
    }
  };

  const switchToTeam = (teamId) => {
    if (socket && isConnected) {
      socket.emit('switch-team', teamId);
    }
  };

  const addTeam = () => {
    if (!newTeamName.trim() || teams.length >= 4) {
      alert('Maximum 4 teams allowed');
      return;
    }
    
    const colors = ['#FF6B6B', '#4D96FF', '#4CAF50', '#FFD700'];
    const newTeam = {
      id: teams.length + 1,
      name: newTeamName.trim(),
      score: 0,
      color: colors[teams.length % colors.length],
      isPlaying: false
    };
    
    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);
    if (socket && isConnected) {
      socket.emit('update-teams', updatedTeams);
    }
    setNewTeamName('');
  };

  const removeTeam = (teamId) => {
    if (teams.length <= 2) {
      alert('Minimum 2 teams required');
      return;
    }
    
    const teamToRemove = teams.find(t => t.id === teamId);
    const wasPlaying = teamToRemove?.isPlaying;
    let newTeams = teams.filter(team => team.id !== teamId);
    
    if (wasPlaying && newTeams.length > 0) {
      newTeams[0].isPlaying = true;
    }
    
    setTeams(newTeams);
    if (socket && isConnected) {
      socket.emit('update-teams', newTeams);
    }
  };

  const startEditTeamScore = (teamId, currentScore) => {
    setEditingTeamScore(teamId);
    setTempTeamScore(currentScore.toString());
  };

  const saveTeamScore = (teamId) => {
    const score = parseFloat(tempTeamScore);
    if (isNaN(score)) {
      alert('Please enter a valid number');
      return;
    }

    const updatedTeams = teams.map(team =>
      team.id === teamId
        ? { ...team, score: roundToTwo(score) }
        : team
    );

    setTeams(updatedTeams);
    if (socket && isConnected) {
      socket.emit('update-teams', updatedTeams);
    }
    setEditingTeamScore(null);
    setTempTeamScore('');
  };

  const cancelEditTeamScore = () => {
    setEditingTeamScore(null);
    setTempTeamScore('');
  };

  const editBoxCategory = (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    setEditingCategory(boxId);
    setNewCategoryName(box.category);
  };

  const saveBoxCategory = (boxId) => {
    if (!newCategoryName.trim()) {
      alert('Category name cannot be empty');
      return;
    }
    
    const updatedBoxes = boxes.map(box => 
      box.id === boxId 
        ? { ...box, category: newCategoryName.trim() }
        : box
    );
    
    setBoxes(updatedBoxes);
    if (socket && isConnected) {
      socket.emit('update-boxes', updatedBoxes);
    }
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const cancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const addWordToBox = (boxIndex) => {
    if (!newWord.trim()) {
      alert('Please enter a word');
      return;
    }
    
    const updatedBoxes = [...boxes];
    if (updatedBoxes[boxIndex]) {
      updatedBoxes[boxIndex].words.push(newWord.trim());
      setBoxes(updatedBoxes);
      if (socket && isConnected) {
        socket.emit('update-boxes', updatedBoxes);
      }
      setNewWord('');
    }
  };

  const removeWordFromBox = (boxIndex, wordIndex) => {
    const updatedBoxes = [...boxes];
    if (updatedBoxes[boxIndex] && updatedBoxes[boxIndex].words[wordIndex]) {
      updatedBoxes[boxIndex].words.splice(wordIndex, 1);
      setBoxes(updatedBoxes);
      if (socket && isConnected) {
        socket.emit('update-boxes', updatedBoxes);
      }
    }
  };

  const resetBox = (boxIndex) => {
    const updatedBoxes = [...boxes];
    if (updatedBoxes[boxIndex]) {
      updatedBoxes[boxIndex].conqueredBy = null;
      updatedBoxes[boxIndex].isCurrent = false;
      setBoxes(updatedBoxes);
      if (socket && isConnected) {
        socket.emit('update-boxes', updatedBoxes);
      }
    }
  };

  const resetGame = () => {
    if (window.confirm('Are you sure you want to reset the entire game? This will clear all scores and conquered boxes.')) {
      if (socket && isConnected) {
        socket.emit('reset-game');
      }
    }
  };

  const resetAllScores = () => {
    const updatedTeams = teams.map(t => ({ ...t, score: 0 }));
    setTeams(updatedTeams);
    if (socket && isConnected) {
      socket.emit('update-teams', updatedTeams);
    }
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
      <div className="admin-panel">
        {/* Admin Header */}
        <div className="header">
          <h1>🎪 Betaliz Word Game</h1>
          <div className="admin-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
            {connectionError && <span className="connection-error">{connectionError}</span>}
            <span className="player-count">👥 Teams: {teams.length}</span>
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTeam();
                    }
                  }}
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
                        {editingTeamScore === team.id ? (
                          <div className="team-score-edit">
                            <input
                              type="number"
                              value={tempTeamScore}
                              onChange={(e) => setTempTeamScore(e.target.value)}
                              className="team-input score-input"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveTeamScore(team.id);
                                }
                              }}
                            />
                            <div className="score-edit-buttons">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveTeamScore(team.id);
                                }}
                                className="save-btn"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditTeamScore();
                                }}
                                className="cancel-btn"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="team-score"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditTeamScore(team.id, team.score);
                            }}
                            style={{ cursor: 'pointer' }}
                            title="Click to edit score"
                          >
                            {team.score.toFixed(2)} points
                          </div>
                        )}
                      </div>
                      <div className="team-actions">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToTeam(team.id);
                          }}
                          className={`switch-btn ${team.isPlaying ? 'current' : ''}`}
                        >
                          {team.isPlaying ? '🎯 Current' : 'Set Active'}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTeam(team.id);
                          }}
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
                   Switch to Next Team
                </button>
                <button 
                  onClick={resetAllScores}
                  className="quick-btn reset"
                >
                  Reset All Scores
                </button>
                <button 
                  onClick={resetGame}
                  className="quick-btn danger"
                >
                   Reset Entire Game
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
                    disabled={gameStarted || currentBox === null || !isConnected}
                    className="control-btn start-btn"
                  >
                    ▶ Start Round
                  </button>
                  <button 
                    onClick={markCorrect}
                    disabled={!gameStarted || !isConnected}
                    className="control-btn correct-btn"
                  >
                    ✓ Correct Guess
                  </button>
                  <button 
                    onClick={skipWord}
                    disabled={!gameStarted || !isConnected}
                    className="control-btn skip-btn"
                  >
                    ⏭ Skip Word
                  </button>
                  <button 
                    onClick={conquerBox}
                    disabled={!gameStarted || getCurrentBox()?.conqueredBy || !isConnected}
                    className="control-btn conquer-btn"
                  >
                    🏆 Conquer Box
                  </button>
                  <button 
                    onClick={endRound}
                    disabled={!isConnected}
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
                {/* Row 1: Box 1 */}
                <div className="pyramid-row">
                  <div 
                    className={`pyramid-box ${boxes[0]?.isCurrent ? 'current' : ''} ${boxes[0]?.conqueredBy ? 'conquered' : ''}`}
                    onClick={() => !boxes[0]?.conqueredBy && editingCategory !== 1 && startBox(1)}
                    style={{ 
                      backgroundColor: boxes[0]?.conqueredBy ? '#aaa' : boxes[0]?.color,
                      cursor: boxes[0]?.conqueredBy || editingCategory === 1 ? 'not-allowed' : 'pointer',
                      opacity: boxes[0]?.conqueredBy ? 0.7 : 1
                    }}
                  >
                    {editingCategory === 1 ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="category-input"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveBoxCategory(1);
                            }
                          }}
                        />
                        <div className="edit-buttons">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              saveBoxCategory(1);
                            }}
                            className="save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditCategory();
                            }}
                            className="cancel-btn"
                          >
                            ✗
                          </button>
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
                    {!boxes[0]?.conqueredBy && editingCategory !== 1 && (
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
                    )}
                  </div>
                </div>
                
                {/* Row 2: Box 2, 3 */}
                <div className="pyramid-row">
                  {[1, 2].map(index => {
                    const box = boxes[index];
                    const boxId = box?.id;
                    return (
                      <div 
                        key={boxId}
                        className={`pyramid-box ${box?.isCurrent ? 'current' : ''} ${box?.conqueredBy ? 'conquered' : ''}`}
                        onClick={() => !box?.conqueredBy && editingCategory !== boxId && startBox(boxId)}
                        style={{ 
                          backgroundColor: box?.conqueredBy ? '#aaa' : box?.color,
                          cursor: box?.conqueredBy || editingCategory === boxId ? 'not-allowed' : 'pointer',
                          opacity: box?.conqueredBy ? 0.7 : 1
                        }}
                      >
                        {editingCategory === boxId ? (
                          <div className="category-edit-form">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="category-input"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveBoxCategory(boxId);
                                }
                              }}
                            />
                            <div className="edit-buttons">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveBoxCategory(boxId);
                                }}
                                className="save-btn"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditCategory();
                                }}
                                className="cancel-btn"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="box-number">{box?.id}</div>
                            <div className="box-category">{box?.category}</div>
                            <div className="box-points">{box?.points} pts</div>
                            {box?.conqueredBy && (
                              <div className="conquered-label">🏆 {box?.conqueredBy}</div>
                            )}
                          </>
                        )}
                        {!box?.conqueredBy && editingCategory !== boxId && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              editBoxCategory(boxId);
                            }}
                            className="edit-category-btn"
                            title="Edit category name"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Row 3: Box 4, 5, 6 */}
                <div className="pyramid-row">
                  {[3, 4, 5].map(index => {
                    const box = boxes[index];
                    const boxId = box?.id;
                    return (
                      <div 
                        key={boxId}
                        className={`pyramid-box ${box?.isCurrent ? 'current' : ''} ${box?.conqueredBy ? 'conquered' : ''}`}
                        onClick={() => !box?.conqueredBy && editingCategory !== boxId && startBox(boxId)}
                        style={{ 
                          backgroundColor: box?.conqueredBy ? '#aaa' : box?.color,
                          cursor: box?.conqueredBy || editingCategory === boxId ? 'not-allowed' : 'pointer',
                          opacity: box?.conqueredBy ? 0.7 : 1
                        }}
                      >
                        {editingCategory === boxId ? (
                          <div className="category-edit-form">
                            <input
                              type="text"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="category-input"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  saveBoxCategory(boxId);
                                }
                              }}
                            />
                            <div className="edit-buttons">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveBoxCategory(boxId);
                                }}
                                className="save-btn"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditCategory();
                                }}
                                className="cancel-btn"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="box-number">{box?.id}</div>
                            <div className="box-category">{box?.category}</div>
                            <div className="box-points">{box?.points} pts</div>
                            {box?.conqueredBy && (
                              <div className="conquered-label">🏆 {box?.conqueredBy}</div>
                            )}
                          </>
                        )}
                        {!box?.conqueredBy && editingCategory !== boxId && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              editBoxCategory(boxId);
                            }}
                            className="edit-category-btn"
                            title="Edit category name"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Row 4: Box 7 */}
                <div className="pyramid-row">
                  <div 
                    className={`pyramid-box ${boxes[6]?.isCurrent ? 'current' : ''} ${boxes[6]?.conqueredBy ? 'conquered' : ''}`}
                    onClick={() => !boxes[6]?.conqueredBy && editingCategory !== 7 && startBox(7)}
                    style={{ 
                      backgroundColor: boxes[6]?.conqueredBy ? '#aaa' : boxes[6]?.color,
                      cursor: boxes[6]?.conqueredBy || editingCategory === 7 ? 'not-allowed' : 'pointer',
                      opacity: boxes[6]?.conqueredBy ? 0.7 : 1
                    }}
                  >
                    {editingCategory === 7 ? (
                      <div className="category-edit-form">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="category-input"
                          autoFocus
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveBoxCategory(7);
                            }
                          }}
                        />
                        <div className="edit-buttons">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              saveBoxCategory(7);
                            }}
                            className="save-btn"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditCategory();
                            }}
                            className="cancel-btn"
                          >
                            ✗
                          </button>
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
                    {!boxes[6]?.conqueredBy && editingCategory !== 7 && (
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
                    )}
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addWordToBox(selectedBoxForWords);
                      }
                    }}
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
    </div>
  );
}

// Player View Component
function PlayerView() {
  const [teams, setTeams] = useState(defaultTeams);
  const [boxes, setBoxes] = useState(defaultBoxes);
  const [currentBox, setCurrentBox] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [correctWords, setCorrectWords] = useState([]);
  const [skippedWords, setSkippedWords] = useState([]);
  const [wordDisplayStyle, setWordDisplayStyle] = useState('one-by-one');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const { socket } = useSocket();

  // Register as player when socket connects
  useEffect(() => {
    if (socket) {
      socket.emit('register-client', { type: 'player' });
    }
  }, [socket]);

  // Listen for game state updates
  useEffect(() => {
    if (!socket) return;

    const handleGameState = (state) => {
      setTeams(state.teams || defaultTeams);
      setBoxes(state.boxes || defaultBoxes);
      setCurrentBox(state.currentBox || null);
      setCurrentWordIndex(state.currentWordIndex || 0);
      setGameStarted(state.gameStarted || false);
      setTimer(state.timer || 30);
      setCorrectWords(state.correctWords || []);
      setSkippedWords(state.skippedWords || []);
      setIsConnected(true);
      setLoading(false);
    };

    const handleTimerUpdate = (newTimer) => {
      setTimer(newTimer);
    };

    const handleWordCorrect = (data) => {
      setCorrectWords(data.correctWords || []);
    };

    const handleWordSkipped = (data) => {
      setSkippedWords(data.skippedWords || []);
    };

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on('game-state', handleGameState);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('word-correct', handleWordCorrect);
    socket.on('word-skipped', handleWordSkipped);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('game-state', handleGameState);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('word-correct', handleWordCorrect);
      socket.off('word-skipped', handleWordSkipped);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // If loading, show loading screen
  if (loading) {
    return (
      <div className="player-view">
        <div className="waiting-screen">
          <div className="waiting-icon">🔄</div>
          <h3>Connecting to Game Server...</h3>
          <p>Please make sure the admin panel is open and game is setup.</p>
        </div>
      </div>
    );
  }

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
          ⚠️ Disconnected from Game Server
        </div>
      )}
      
      {/* Player Header */}
      <div className="player-header">
        <h2>🎮 የተጫዋቾች ስክሪን</h2>
        <div className="player-info">
          <div className="info-card">
            <div className="label">የእርሶ ቡድን:</div>
            <div className="value" style={{ color: currentTeam?.color }}>
              {currentTeam?.name || 'No team playing'}
            </div>
          </div>
          <div className="info-card">
            <div className="label">የቀሮት ሰአት:</div>
            <div className={`timer ${timer <= 10 ? 'warning' : ''}`}>
              {timer} seconds
            </div>
          </div>
          <div className="info-card">
            <div className="label">የገመቱት ቃል:</div>
            <div className="value">{correctWords.length}</div>
          </div>
          <div className="info-card">
            <div className="label">የቡድኖ ነጥብ:</div>
            <div className="value">{currentTeam?.score?.toFixed(2) || '0.00'} pts</div>
          </div>
        </div>
      </div>
      
      <div className="player-content">
        {/* Left: Pyramid View */}
        <div className="player-pyramid-section">
          <h3>📦 ሳጥኖች</h3>
          <div className="player-pyramid">
            {/* Row 1: Box 1 */}
            <div className="pyramid-row">
              <div 
                className={`player-pyramid-box ${boxes[0]?.isCurrent ? 'current' : ''} ${boxes[0]?.conqueredBy ? 'conquered' : ''}`}
                style={{ 
                  backgroundColor: boxes[0]?.conqueredBy ? '#aaa' : boxes[0]?.color,
                  opacity: boxes[0]?.conqueredBy ? 0.7 : 1
                }}
              >
                <div className="box-number">1</div>
                <div className="box-category">{boxes[0]?.category}</div>
                <div className="box-points">{boxes[0]?.points} pts</div>
                {boxes[0]?.isCurrent && <div className="current-indicator">🎯 እየተጫወቱ ነው</div>}
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
                    backgroundColor: boxes[index]?.conqueredBy ? '#aaa' : boxes[index]?.color,
                    opacity: boxes[index]?.conqueredBy ? 0.7 : 1
                  }}
                >
                  <div className="box-number">{boxes[index]?.id}</div>
                  <div className="box-category">{boxes[index]?.category}</div>
                  <div className="box-points">{boxes[index]?.points} pts</div>
                  {boxes[index]?.isCurrent && <div className="current-indicator">🎯 እየተጫወቱ ነው</div>}
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
                    backgroundColor: boxes[index]?.conqueredBy ? '#aaa' : boxes[index]?.color,
                    opacity: boxes[index]?.conqueredBy ? 0.7 : 1
                  }}
                >
                  <div className="box-number">{boxes[index]?.id}</div>
                  <div className="box-category">{boxes[index]?.category}</div>
                  <div className="box-points">{boxes[index]?.points} pts</div>
                  {boxes[index]?.isCurrent && <div className="current-indicator">🎯 እየተጫወቱ ነው</div>}
                  {boxes[index]?.conqueredBy && <div className="conquered-label">🏆 {boxes[index]?.conqueredBy}</div>}
                </div>
              ))}
            </div>
            
            {/* Row 4: Box 7 */}
            <div className="pyramid-row">
              <div 
                className={`player-pyramid-box ${boxes[6]?.isCurrent ? 'current' : ''} ${boxes[6]?.conqueredBy ? 'conquered' : ''}`}
                style={{ 
                  backgroundColor: boxes[6]?.conqueredBy ? '#aaa' : boxes[6]?.color,
                  opacity: boxes[6]?.conqueredBy ? 0.7 : 1
                }}
              >
                <div className="box-number">7</div>
                <div className="box-category">{boxes[6]?.category}</div>
                <div className="box-points">{boxes[6]?.points} pts</div>
                {boxes[6]?.isCurrent && <div className="current-indicator">🎯 እየተጫወቱ ነው</div>}
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
              <h3>ጨዋታው እስኪጀመር ይጠብቁ</h3>
              <p>ዙሩ ሲጀምር ቃላቶች አንድ በአንድ እዚህ ጋር ይታያሉ።</p>
              <div className="instructions">
                <p><strong>🔖ፍንጭ ሰጪ መመሪያዎች፡-:</strong></p>
                <p>1. ትክክለኛውን ቃል ሳይናገሩ እያንዳንዱን ቃል ይግለጹ</p>
                <p>2. የቡድን ጓደኛዎ በእርስዎ ፍንጮች ላይ በመመስረት መገመት አለበት።</p>
                <p>3. የጨዋታው ዳኛ ትክክለኛ መልሶች ላይ ምልክት ያደርጋል።</p>
                <p>4. በ 30 ሰከንዶች ውስጥ በተቻለ መጠን ብዙ ያግኙ!</p>
              </div>
            </div>
          ) : (
            <div className="active-game">
              <div className="word-display-header">
                <h3>ይህንን ቃል ለቡድን ጓደኛዎ ይግለጹ:</h3>
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
                      {timer}s ይቀሮታል
                    </div>
                  </div>
                )}
                
                <div className="display-style-toggle">
                  <button
                    onClick={() => setWordDisplayStyle('one-by-one')}
                    className={`style-btn ${wordDisplayStyle === 'one-by-one' ? 'active' : ''}`}
                  >
                    አንድ በአንድ
                  </button>
                  <button
                    onClick={() => setWordDisplayStyle('flashcard')}
                    className={`style-btn ${wordDisplayStyle === 'flashcard' ? 'active' : ''}`}
                  >
                    በትልቁ
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
        <h3>🏆እሁን ያለው ውጤት ድምር</h3>
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
                {team.isPlaying && <div className="playing-indicator">🎯 እየተጫወቱ ነው</div>}
              </div>
              <div className="team-score">{team.score?.toFixed(2) || '0.00'} ነጥብ</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;