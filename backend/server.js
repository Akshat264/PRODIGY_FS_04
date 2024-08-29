const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;
const cookieParser=require("cookie-parser");
const cors= require("cors");
const socketIo = require('socket.io');
const Message= require("./Models/message.js");
const http= require("http");
const server = http.createServer(app);
const uri=process.env.URL;
const roomRouter= require("./routes/roomroutes.js");
const io = socketIo(server, {
  cors: {
      origin: uri, // Allow requests from this origin
      methods: ['GET', 'POST'],
      credentials: true
  }
});
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
const path = require('path');
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// CORS options
const corsOptions = {
  origin: uri, // Allow requests from this origin
  credentials: true, // Enable to accept credentials (cookies, authorization headers, etc.)
};

app.use(cors(corsOptions));
// MongoDB connection
async function connecttodb() {
    const url = process.env.MONGO_DB;
    console.log(url);
    try {
      await mongoose.connect(url, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
      });
      console.log("connected");
    } catch (error) {
      console.log("not connected");
    }
  }
  connecttodb();
app.use(bodyParser.json());
// Routes
const authRouter = require('./routes/authentication');
const getPost=require('./routes/getprofile');
// Socket.IO setup
io.on('connection', (socket) => {
  console.log('A client connected.');

  socket.on('userConnected', ({ userId }) => {
      // Join the user to a room identified by their userId
      socket.join(userId);
      console.log(`User connected: ${userId}`);
  });

  socket.on('sendMessage', async (data) => {
      const { sender, receiver, message } = data;

      try {
          // Save the message to the database
          const newMessage = new Message({ sender: sender, receiver: receiver, message });
          await newMessage.save();

          // Emit the message to the receiver's room
          io.to(receiver).emit('receiveMessage', newMessage);

      } catch (error) {
          console.error('Error saving message:', error);
      }
  });

  socket.on('userDisconnected', ({ userId }) => {
      console.log(`User disconnected: ${userId}`);
      // Perform any necessary cleanup or status updates here
  });
socket.on('joinRoom', ({ roomId, userId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
});
socket.on('leaveRoom', ({ roomId, userId }) => {
  console.log(`User ${userId} left room ${roomId}`);
});
// Handle sending messages to a room
socket.on('sendRoomMessage', (data) => {
    const { roomId, message, sender } = data;
    io.to(roomId).emit('receiveRoomMessage', { message, sender, roomId });
});
  socket.on('disconnect', () => {
      console.log('Client disconnected');
  });
});
app.use('/api',roomRouter);
app.use('/api', authRouter);
app.use('/api',getPost);
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});