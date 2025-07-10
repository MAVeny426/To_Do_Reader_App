const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const authRouter = require('./routes/auth');
const taskRouter = require('./routes/userRoute');
const activityRouter = require('./routes/activityLogRoute');

dotenv.config();

const app = express();
const server = http.createServer(app); // Wrap app with http server

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Save io instance to app so you can use it in route handlers
app.set('io', io);

app.use(cors());
app.use(express.json());

// Mount routes
app.use('/auth', authRouter);
app.use('/tasks', taskRouter);
app.use('/activitylog', activityRouter);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// ✅ Real-time socket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Optional: You can listen to client events if needed
  socket.on('taskUpdated', (task) => {
    // Broadcast to all other clients
    socket.broadcast.emit('taskUpdated', task);
  });

  socket.on('newComment', (task) => {
    socket.broadcast.emit('newComment', task);
  });

  // ✅ Listen for task editing start
  socket.on('editingTask', ({ taskId, user }) => {
    // Broadcast to all other clients
    socket.broadcast.emit('taskBeingEdited', { taskId, user });
  });

  // ✅ Listen for task editing stop
  socket.on('stopEditingTask', ({ taskId }) => {
    socket.broadcast.emit('taskStoppedEditing', { taskId });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
