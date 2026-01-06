import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc,
  collection,
  getDocs,
  query
} from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
        <div className="login-note">
          <p>Default: admin@game.com / admin123</p>
          <p>Or set REACT_APP_ADMIN_EMAIL and REACT_APP_ADMIN_PASSWORD in .env</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to round to 2 decimal places
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Admin Panel Component with Firebase Integration
function AdminPanel() {
  const [teams, setTeams] = useState([]);
  const [boxes, setBoxes] = useState([]);
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
  const [isConnected, setIsConnected] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTeamScore, setEditingTeamScore] = useState(null);
  const [tempTeamScore, setTempTeamScore] = useState('');
  const timerIntervalRef = useRef(null);

  // Check authentication on component mount
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

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = '/login';
  };

  // Initialize default data
  const defaultTeams = [
    { id: 1, name: 'Team Red', score: 0, color: '#FF6B6B', isPlaying: true },
    { id: 2, name: 'Team Blue', score: 0, color: '#4D96FF', isPlaying: false },
    { id: 3, name: 'Team Green', score: 0, color: '#4CAF50', isPlaying: false }
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

  // Load initial data from Firebase
  useEffect(() => {
    let unsubscribeTeams, unsubscribeBoxes, unsubscribeState;

    const loadInitialData = async () => {
      try {
        // Load teams
        const teamsDoc = doc(db, 'game', 'teams');
        unsubscribeTeams = onSnapshot(teamsDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setTeams(data.teams || defaultTeams);
          } else {
            // Initialize with default teams
            setDoc(teamsDoc, { teams: defaultTeams });
            setTeams(defaultTeams);
          }
          setIsConnected(true);
        }, (error) => {
          console.error('Teams listener error:', error);
          setIsConnected(false);
        });

        // Load boxes
        const boxesDoc = doc(db, 'game', 'boxes');
        unsubscribeBoxes = onSnapshot(boxesDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setBoxes(data.boxes || defaultBoxes);
          } else {
            // Initialize with default boxes
            setDoc(boxesDoc, { boxes: defaultBoxes });
            setBoxes(defaultBoxes);
          }
          setIsConnected(true);
        }, (error) => {
          console.error('Boxes listener error:', error);
          setIsConnected(false);
        });

        // Load game state
        const gameStateDoc = doc(db, 'game', 'state');
        unsubscribeState = onSnapshot(gameStateDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setCurrentBox(data.currentBox || null);
            setCurrentWordIndex(data.currentWordIndex || 0);
            setGameStarted(data.gameStarted || false);
            setTimer(data.timer || 30);
            setIsTimerRunning(data.isTimerRunning || false);
            setCorrectWords(data.correctWords || []);
            setSkippedWords(data.skippedWords || []);
          } else {
            // Initialize with default state
            const defaultState = {
              currentBox: null,
              currentWordIndex: 0,
              gameStarted: false,
              timer: 30,
              isTimerRunning: false,
              correctWords: [],
              skippedWords: []
            };
            setDoc(gameStateDoc, defaultState);
          }
          setIsConnected(true);
        }, (error) => {
          console.error('State listener error:', error);
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Error loading data:', error);
        setIsConnected(false);
      }
    };

    if (isAuthenticated) {
      loadInitialData();
    }

    return () => {
      if (unsubscribeTeams) unsubscribeTeams();
      if (unsubscribeBoxes) unsubscribeBoxes();
      if (unsubscribeState) unsubscribeState();
    };
  }, [isAuthenticated]);

  // Timer effect - UPDATED for better synchronization
  useEffect(() => {
    // Clear any existing interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Start new interval if timer is running
    if (isTimerRunning && timer > 0) {
      timerIntervalRef.current = setInterval(async () => {
        const newTimer = timer - 1;
        setTimer(newTimer);
        
        // Update timer in Firebase
        const gameStateDoc = doc(db, 'game', 'state');
        await updateDoc(gameStateDoc, { timer: newTimer });
        
        if (newTimer <= 0) {
          clearInterval(timerIntervalRef.current);
          setIsTimerRunning(false);
          setGameStarted(false);
          
          // Update game state in Firebase
          await updateDoc(gameStateDoc, {
            isTimerRunning: false,
            gameStarted: false,
            timer: 0
          });
        }
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isTimerRunning, timer]);

  // Helper function to get current box object
  const getCurrentBox = () => {
    return boxes.find(b => b.id === currentBox);
  };

  // Update Firebase document
  const updateFirebaseDoc = async (collectionName, data) => {
    try {
      const docRef = doc(db, 'game', collectionName);
      await updateDoc(docRef, data);
      setIsConnected(true);
      return true;
    } catch (error) {
      console.error(`Error updating ${collectionName}:`, error);
      setIsConnected(false);
      return false;
    }
  };

  // Start a box
  const startBox = async (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box || box.conqueredBy) return;
    
    // Reset current boxes
    const updatedBoxes = boxes.map(b => ({
      ...b,
      isCurrent: b.id === boxId
    }));
    
    // Update boxes in Firebase
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
    
    // Update game state in Firebase
    await updateFirebaseDoc('state', {
      currentBox: box.id,
      currentWordIndex: 0,
      gameStarted: false,
      timer: 30,
      isTimerRunning: false,
      correctWords: [],
      skippedWords: []
    });
  };

  // Start the game
  const startGame = async () => {
    if (currentBox === null) {
      alert('Please select a box first!');
      return;
    }

    // Clear any existing timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    await updateFirebaseDoc('state', {
      gameStarted: true,
      isTimerRunning: true,
      timer: 30,
      currentWordIndex: 0,
      correctWords: [],
      skippedWords: []
    });
  };

  // Mark word as correct
  const markCorrect = async () => {
    if (!gameStarted || currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    const currentWord = currentBoxObj.words[currentWordIndex];
    const newCorrectWords = [...correctWords, currentWord];
    
    // Update correct words in Firebase
    await updateFirebaseDoc('state', { correctWords: newCorrectWords });
    
    // Update team score with rounded value
    const currentTeam = teams.find(t => t.isPlaying);
    if (currentTeam && currentBoxObj.words.length > 0) {
      const pointsPerWord = currentBoxObj.points / currentBoxObj.words.length;
      const roundedPoints = roundToTwo(pointsPerWord);
      
      const updatedTeams = teams.map(team => 
        team.id === currentTeam.id 
          ? { ...team, score: roundToTwo(team.score + roundedPoints) }
          : team
      );
      
      // Update teams in Firebase
      await updateFirebaseDoc('teams', { teams: updatedTeams });
    }
    
    await nextWord();
  };

  // Skip word
  const skipWord = async () => {
    if (!gameStarted || currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    const currentWord = currentBoxObj.words[currentWordIndex];
    const newSkippedWords = [...skippedWords, currentWord];
    
    // Update skipped words in Firebase
    await updateFirebaseDoc('state', { skippedWords: newSkippedWords });
    
    await nextWord();
  };

  // Next word
  const nextWord = async () => {
    if (currentBox === null) return;
    
    const currentBoxObj = getCurrentBox();
    if (!currentBoxObj) return;
    
    if (currentWordIndex < currentBoxObj.words.length - 1) {
      const newIndex = currentWordIndex + 1;
      await updateFirebaseDoc('state', { currentWordIndex: newIndex });
    } else {
      await endRound();
    }
  };

  // End round
  const endRound = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    await updateFirebaseDoc('state', {
      isTimerRunning: false,
      gameStarted: false
    });
  };

  // Switch to next team
  const switchToNextTeam = async () => {
    const currentIndex = teams.findIndex(t => t.isPlaying);
    const nextIndex = (currentIndex + 1) % teams.length;
    
    const updatedTeams = teams.map((team, index) => ({
      ...team,
      isPlaying: index === nextIndex
    }));
    
    await updateFirebaseDoc('teams', { teams: updatedTeams });
  };

  // Switch to specific team
  const switchToTeam = async (teamId) => {
    const updatedTeams = teams.map(team => ({
      ...team,
      isPlaying: team.id === teamId
    }));
    
    await updateFirebaseDoc('teams', { teams: updatedTeams });
  };

  // Add team
  const addTeam = async () => {
    if (!newTeamName.trim() || teams.length >= 4) return;
    
    const colors = ['#FF6B6B', '#4D96FF', '#4CAF50', '#FFD700'];
    const newTeam = {
      id: teams.length + 1,
      name: newTeamName.trim(),
      score: 0,
      color: colors[teams.length % colors.length],
      isPlaying: false
    };
    
    const updatedTeams = [...teams, newTeam];
    await updateFirebaseDoc('teams', { teams: updatedTeams });
    setNewTeamName('');
  };

  // Remove team
  const removeTeam = async (teamId) => {
    if (teams.length <= 2) return;
    const teamToRemove = teams.find(t => t.id === teamId);
    const wasPlaying = teamToRemove?.isPlaying;
    const newTeams = teams.filter(team => team.id !== teamId);
    
    // If we removed the current team, make the first team current
    if (wasPlaying && newTeams.length > 0) {
      newTeams[0].isPlaying = true;
    }
    
    await updateFirebaseDoc('teams', { teams: newTeams });
  };

  // Edit team score
  const startEditTeamScore = (teamId, currentScore) => {
    setEditingTeamScore(teamId);
    setTempTeamScore(currentScore.toString());
  };

  // Save team score
  const saveTeamScore = async (teamId) => {
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

    await updateFirebaseDoc('teams', { teams: updatedTeams });
    setEditingTeamScore(null);
    setTempTeamScore('');
  };

  // Cancel editing score
  const cancelEditTeamScore = () => {
    setEditingTeamScore(null);
    setTempTeamScore('');
  };

  // Edit box category name
  const editBoxCategory = (boxId) => {
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    
    setEditingCategory(boxId);
    setNewCategoryName(box.category);
  };

  // Save box category name
  const saveBoxCategory = async (boxId) => {
    if (!newCategoryName.trim()) return;
    
    const updatedBoxes = boxes.map(box => 
      box.id === boxId 
        ? { ...box, category: newCategoryName.trim() }
        : box
    );
    
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
    setEditingCategory(null);
    setNewCategoryName('');
  };

  // Cancel editing category
  const cancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  // Add word to box
  const addWordToBox = async (boxIndex) => {
    if (!newWord.trim()) return;
    
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].words.push(newWord.trim());
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
    setNewWord('');
  };

  // Remove word from box
  const removeWordFromBox = async (boxIndex, wordIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].words.splice(wordIndex, 1);
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
  };

  // Conquer box for current team
  const conquerBox = async () => {
    const currentTeam = teams.find(t => t.isPlaying);
    if (!currentTeam || currentBox === null) return;
    
    const currentBoxIndex = boxes.findIndex(b => b.id === currentBox);
    if (currentBoxIndex === -1) return;
    
    const updatedBoxes = [...boxes];
    updatedBoxes[currentBoxIndex].conqueredBy = currentTeam.name;
    updatedBoxes[currentBoxIndex].isCurrent = false;
    
    // Award box points (rounded)
    const updatedTeams = teams.map(team => 
      team.id === currentTeam.id 
        ? { ...team, score: roundToTwo(team.score + boxes[currentBoxIndex].points) }
        : team
    );
    
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
    await updateFirebaseDoc('teams', { teams: updatedTeams });
    
    await updateFirebaseDoc('state', {
      currentBox: null,
      gameStarted: false,
      isTimerRunning: false,
      timer: 30
    });
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Reset box
  const resetBox = async (boxIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].conqueredBy = null;
    updatedBoxes[boxIndex].isCurrent = false;
    await updateFirebaseDoc('boxes', { boxes: updatedBoxes });
  };

  // Reset entire game
  const resetGame = async () => {
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
      
      const resetState = {
        currentBox: null,
        currentWordIndex: 0,
        gameStarted: false,
        isTimerRunning: false,
        timer: 30,
        correctWords: [],
        skippedWords: []
      };
      
      await updateFirebaseDoc('teams', { teams: resetTeams });
      await updateFirebaseDoc('boxes', { boxes: resetBoxes });
      await updateFirebaseDoc('state', resetState);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Get current team
  const currentTeam = teams.find(t => t.isPlaying);

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
          <h1>🎪 Betaliz Word Game - Admin Panel</h1>
          <div className="admin-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
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
                  🔄 Switch to Next Team
                </button>
                <button 
                  onClick={async () => {
                    const updatedTeams = teams.map(t => ({ ...t, score: 0 }));
                    await updateFirebaseDoc('teams', { teams: updatedTeams });
                  }}
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
                    disabled={!gameStarted || getCurrentBox()?.conqueredBy}
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

// Player View Component with Firebase Integration
function PlayerView() {
  const [teams, setTeams] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [currentBox, setCurrentBox] = useState(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timer, setTimer] = useState(30);
  const [correctWords, setCorrectWords] = useState([]);
  const [skippedWords, setSkippedWords] = useState([]);
  const [wordDisplayStyle, setWordDisplayStyle] = useState('one-by-one');
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase updates - COMPLETELY SYNCHRONIZED WITH ADMIN
  useEffect(() => {
    let unsubscribeTeams, unsubscribeBoxes, unsubscribeState;

    const setupFirebaseListeners = () => {
      try {
        // Listen to teams - SAME AS ADMIN
        const teamsDoc = doc(db, 'game', 'teams');
        unsubscribeTeams = onSnapshot(teamsDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setTeams(data.teams || []);
            setIsConnected(true);
          } else {
            setTeams([]);
          }
        }, (error) => {
          console.error('Teams listener error:', error);
          setIsConnected(false);
        });

        // Listen to boxes - SAME AS ADMIN
        const boxesDoc = doc(db, 'game', 'boxes');
        unsubscribeBoxes = onSnapshot(boxesDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setBoxes(data.boxes || []);
            setIsConnected(true);
          } else {
            setBoxes([]);
          }
        }, (error) => {
          console.error('Boxes listener error:', error);
          setIsConnected(false);
        });

        // Listen to game state - SAME AS ADMIN
        const gameStateDoc = doc(db, 'game', 'state');
        unsubscribeState = onSnapshot(gameStateDoc, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setCurrentBox(data.currentBox || null);
            setCurrentWordIndex(data.currentWordIndex || 0);
            setGameStarted(data.gameStarted || false);
            setTimer(data.timer || 30);
            setCorrectWords(data.correctWords || []);
            setSkippedWords(data.skippedWords || []);
            setIsConnected(true);
            setLoading(false);
          } else {
            // Initialize with default state if not exists
            const defaultState = {
              currentBox: null,
              currentWordIndex: 0,
              gameStarted: false,
              timer: 30,
              isTimerRunning: false,
              correctWords: [],
              skippedWords: []
            };
            setDoc(gameStateDoc, defaultState);
          }
        }, (error) => {
          console.error('State listener error:', error);
          setIsConnected(false);
        });

      } catch (error) {
        console.error('Error setting up Firebase listeners:', error);
        setIsConnected(false);
        setLoading(false);
      }
    };

    setupFirebaseListeners();

    return () => {
      if (unsubscribeTeams) unsubscribeTeams();
      if (unsubscribeBoxes) unsubscribeBoxes();
      if (unsubscribeState) unsubscribeState();
    };
  }, []);

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
        <h2>🎮 Player Screen - Clue Giver</h2>
        <div className="player-info">
          <div className="info-card">
            <div className="label">Your Team:</div>
            <div className="value" style={{ color: currentTeam?.color }}>
              {currentTeam?.name || 'No team playing'}
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
                  <div className="box-number">{boxes[index]?.id}</div>
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
                  <div className="box-number">{boxes[index]?.id}</div>
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