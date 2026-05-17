// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const rooms = {};  // Store rooms and player assignments

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // When a player joins a room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    
    // Initialize the room if it's not already
    if (!rooms[room]) {
      rooms[room] = { players: [], playerRoles: {} };
    }

    // Add the player to the room and assign role
    const playersInRoom = rooms[room].players;
    if (playersInRoom.length < 2) {
      playersInRoom.push(socket.id);

      // Assign Player 1 or Player 2 based on order of joining
      const role = playersInRoom.length === 1 ? 'Player 1' : 'Player 2';
      rooms[room].playerRoles[socket.id] = role;

      // Notify player of their role
      socket.emit('setRole', role);
      io.to(room).emit('systemMessage', `${role} has joined!`);

      // Once two players have joined, start the game
      if (playersInRoom.length === 2) {
        io.to(room).emit('systemMessage', 'The game has started!');
      }
    } else {
      socket.emit('systemMessage', 'This room is full!');
    }
  });

  // Handle player typing
  socket.on('playerTyped', (data) => {
    // Broadcast typing event to other players in the room
    socket.to(data.room).emit('playerAttack', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
