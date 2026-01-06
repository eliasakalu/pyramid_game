// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Default game state
const defaultTeams = [
  { id: 1, name: 'Team Red', score: 0, color: '#FF6B6B', isPlaying: true },
  { id: 2, name: 'Team Blue', score: 0, color: '#4D96FF', isPlaying: false }
];

const defaultBoxes = [
  {
    id: 1,
    category: 'Movies',
    words: ['Titanic', 'Avatar', 'Star Wars', 'Harry Potter'],
    color: '#FF6B6B',
    isCurrent: false,
    conqueredBy: null,
    points: 100
  },
  {
    id: 2,
    category: 'Animals',
    words: ['Lion', 'Elephant', 'Dolphin', 'Eagle'],
    color: '#4ECDC4',
    isCurrent: false,
    conqueredBy: null,
    points: 200
  },
  {
    id: 3,
    category: 'Countries',
    words: ['France', 'Japan', 'Brazil', 'Australia'],
    color: '#45B7D1',
    isCurrent: false,
    conqueredBy: null,
    points: 300
  },
  {
    id: 4,
    category: 'Fruits',
    words: ['Apple', 'Banana', 'Orange', 'Grape'],
    color: '#96CEB4',
    isCurrent: false,
    conqueredBy: null,
    points: 100
  },
  {
    id: 5,
    category: 'Sports',
    words: ['Soccer', 'Basketball', 'Tennis', 'Swimming'],
    color: '#FFEAA7',
    isCurrent: false,
    conqueredBy: null,
    points: 200
  },
  {
    id: 6,
    category: 'Instruments',
    words: ['Guitar', 'Piano', 'Violin', 'Drums'],
    color: '#DDA0DD',
    isCurrent: false,
    conqueredBy: null,
    points: 300
  },
  {
    id: 7,
    category: 'Science',
    words: ['Physics', 'Chemistry', 'Biology', 'Astronomy'],
    color: '#98D8C8',
    isCurrent: false,
    conqueredBy: null,
    points: 500
  }
];

// Game state (stored in memory)
let gameState = {
  teams: [...defaultTeams],
  boxes: [...defaultBoxes],
  currentBox: null,
  currentWordIndex: 0,
  gameStarted: false,
  timer: 30,
  isTimerRunning: false,
  correctWords: [],
  skippedWords: []
};

// Active timers and connections
let gameTimer = null;
const connectedClients = new Map();

// Helper to round numbers
const roundToTwo = (num) => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

// Broadcast game state to all clients
const broadcastGameState = () => {
  io.emit('game-state', gameState);
};

// Start/stop game timer
const startGameTimer = () => {
  if (gameTimer) clearInterval(gameTimer);
  
  gameState.timer = 30;
  gameState.isTimerRunning = true;
  gameState.gameStarted = true;
  
  gameTimer = setInterval(() => {
    if (gameState.timer > 0) {
      gameState.timer--;
      io.emit('timer-update', gameState.timer);
    } else {
      clearInterval(gameTimer);
      gameTimer = null;
      gameState.isTimerRunning = false;
      gameState.gameStarted = false;
      io.emit('game-ended');
    }
  }, 1000);
};

const stopGameTimer = () => {
  if (gameTimer) {
    clearInterval(gameTimer);
    gameTimer = null;
  }
  gameState.isTimerRunning = false;
  gameState.gameStarted = false;
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Add to connected clients
  connectedClients.set(socket.id, {
    id: socket.id,
    type: null,
    connectedAt: Date.now()
  });

  // Send current game state to new client
  socket.emit('game-state', gameState);

  // Handle client registration (admin or player)
  socket.on('register-client', (data) => {
    connectedClients.set(socket.id, {
      ...connectedClients.get(socket.id),
      type: data.type,
      name: data.name || null
    });
    
    console.log(`Client ${socket.id} registered as ${data.type}`);
  });

  // ========== ADMIN EVENTS ==========
  
  // Update teams
  socket.on('update-teams', (teams) => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      gameState.teams = teams;
      broadcastGameState();
    }
  });

  // Update boxes
  socket.on('update-boxes', (boxes) => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      gameState.boxes = boxes;
      broadcastGameState();
    }
  });

  // Start a box
  socket.on('start-box', (boxId) => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      // Reset all boxes
      gameState.boxes = gameState.boxes.map(box => ({
        ...box,
        isCurrent: box.id === boxId
      }));
      
      gameState.currentBox = boxId;
      gameState.currentWordIndex = 0;
      gameState.correctWords = [];
      gameState.skippedWords = [];
      gameState.timer = 30;
      gameState.gameStarted = false;
      gameState.isTimerRunning = false;
      
      stopGameTimer();
      broadcastGameState();
      io.emit('box-started', boxId);
    }
  });

  // Start game (round)
  socket.on('start-game', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin' && gameState.currentBox) {
      startGameTimer();
      broadcastGameState();
      io.emit('game-started');
    }
  });

  // Mark word as correct
  socket.on('mark-correct', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin' && gameState.currentBox && gameState.gameStarted) {
      const currentBox = gameState.boxes.find(b => b.id === gameState.currentBox);
      if (!currentBox) return;
      
      const currentWord = currentBox.words[gameState.currentWordIndex];
      if (!currentWord) return;
      
      // Add to correct words
      gameState.correctWords.push(currentWord);
      
      // Calculate and add points
      const currentTeam = gameState.teams.find(t => t.isPlaying);
      if (currentTeam && currentBox.words.length > 0) {
        const pointsPerWord = currentBox.points / currentBox.words.length;
        const roundedPoints = roundToTwo(pointsPerWord);
        
        gameState.teams = gameState.teams.map(team => 
          team.id === currentTeam.id 
            ? { ...team, score: roundToTwo(team.score + roundedPoints) }
            : team
        );
      }
      
      // Move to next word
      if (gameState.currentWordIndex < currentBox.words.length - 1) {
        gameState.currentWordIndex++;
      } else {
        stopGameTimer();
      }
      
      broadcastGameState();
      io.emit('word-correct', { 
        word: currentWord, 
        correctWords: gameState.correctWords
      });
    }
  });

  // Skip word
  socket.on('skip-word', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin' && gameState.currentBox && gameState.gameStarted) {
      const currentBox = gameState.boxes.find(b => b.id === gameState.currentBox);
      if (!currentBox) return;
      
      const currentWord = currentBox.words[gameState.currentWordIndex];
      if (!currentWord) return;
      
      gameState.skippedWords.push(currentWord);
      
      // Move to next word
      if (gameState.currentWordIndex < currentBox.words.length - 1) {
        gameState.currentWordIndex++;
      } else {
        stopGameTimer();
      }
      
      broadcastGameState();
      io.emit('word-skipped', { 
        word: currentWord, 
        skippedWords: gameState.skippedWords 
      });
    }
  });

  // Next word manually
  socket.on('next-word', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin' && gameState.currentBox && gameState.gameStarted) {
      const currentBox = gameState.boxes.find(b => b.id === gameState.currentBox);
      if (!currentBox) return;
      
      if (gameState.currentWordIndex < currentBox.words.length - 1) {
        gameState.currentWordIndex++;
        broadcastGameState();
      }
    }
  });

  // Conquer box
  socket.on('conquer-box', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin' && gameState.currentBox) {
      const currentTeam = gameState.teams.find(t => t.isPlaying);
      const boxIndex = gameState.boxes.findIndex(b => b.id === gameState.currentBox);
      
      if (currentTeam && boxIndex !== -1) {
        // Mark box as conquered
        gameState.boxes[boxIndex].conqueredBy = currentTeam.name;
        gameState.boxes[boxIndex].isCurrent = false;
        
        // Award full box points
        const boxPoints = gameState.boxes[boxIndex].points;
        gameState.teams = gameState.teams.map(team => 
          team.id === currentTeam.id 
            ? { ...team, score: roundToTwo(team.score + boxPoints) }
            : team
        );
        
        // Reset game state
        stopGameTimer();
        gameState.currentBox = null;
        gameState.currentWordIndex = 0;
        gameState.correctWords = [];
        gameState.skippedWords = [];
        
        broadcastGameState();
        io.emit('box-conquered', { 
          team: currentTeam.name, 
          boxId: gameState.boxes[boxIndex].id 
        });
      }
    }
  });

  // End round
  socket.on('end-round', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      stopGameTimer();
      broadcastGameState();
      io.emit('round-ended');
    }
  });

  // Switch to next team
  socket.on('switch-team', (teamId = null) => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      if (teamId) {
        // Switch to specific team
        gameState.teams = gameState.teams.map(team => ({
          ...team,
          isPlaying: team.id === teamId
        }));
      } else {
        // Switch to next team
        const currentIndex = gameState.teams.findIndex(t => t.isPlaying);
        const nextIndex = (currentIndex + 1) % gameState.teams.length;
        gameState.teams = gameState.teams.map((team, index) => ({
          ...team,
          isPlaying: index === nextIndex
        }));
      }
      
      broadcastGameState();
      io.emit('team-switched', gameState.teams.find(t => t.isPlaying));
    }
  });

  // Reset game completely
  socket.on('reset-game', () => {
    const client = connectedClients.get(socket.id);
    if (client?.type === 'admin') {
      gameState = {
        teams: [...defaultTeams],
        boxes: [...defaultBoxes],
        currentBox: null,
        currentWordIndex: 0,
        gameStarted: false,
        timer: 30,
        isTimerRunning: false,
        correctWords: [],
        skippedWords: []
      };
      
      stopGameTimer();
      broadcastGameState();
      io.emit('game-reset');
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedClients.delete(socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: Date.now(),
    connectedClients: connectedClients.size,
    gameRunning: gameState.gameStarted
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});