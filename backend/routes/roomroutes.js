// routes/rooms.js
const express = require('express');
const router = express.Router();
const Room = require("../Models/chatroom");
const authMiddleware = require("../verifyToken"); // Middleware to check authentication
const RoomMessage=require("../Models/roommessages.js");
// POST /api/rooms
router.get('/chatrooms',authMiddleware,async(req,res)=>{
    try{
        const rooms=await Room.find({});
        if(!rooms){
            return res.status("404",console.log("No ChatRooms Found"));
        }
        res.status("201").json(rooms);
    }
    catch(error){

    }
})
router.post('/createroom', authMiddleware, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.id;

        // Check if the room already exists
        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            return res.status(400).json({ error: 'Room already exists' });
        }

        // Create a new room
        const room = new Room({
            name,
            createdBy: userId,
            members: [userId] // Add the creator as the first member
        });

        await room.save();
        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create room' });
    }
});
// routes/rooms.js
// POST /api/rooms/:roomId/join
router.post('/:roomId/join', authMiddleware, async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check if the user is already a member of the room
        if (room.members.includes(userId)) {
            return res.status(400).json({ error: 'User already a member of the room' });
        }

        // Add user to the room members
        room.members.push(userId);
        await room.save();

        res.status(200).json({ message: 'Joined the room successfully', room });
    } catch (error) {
        res.status(500).json({ error: 'Failed to join room' });
    }
});
// routes/rooms.js
// POST /api/rooms/:roomId/leave
router.post('/:roomId/leave', authMiddleware, async (req, res) => {
    try {
        const roomId = req.params.roomId;
        const userId = req.user._id;

        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Check if the user is a member of the room
        if (!room.members.includes(userId)) {
            return res.status(400).json({ error: 'User is not a member of the room' });
        }

        // Remove user from the room members
        room.members = room.members.filter(memberId => memberId.toString() !== userId.toString());
        await room.save();

        res.status(200).json({ message: 'Left the room successfully', room });
    } catch (error) {
        res.status(500).json({ error: 'Failed to leave room' });
    }
});

router.post('/:roomId/messages', authMiddleware, async (req, res) => {
  const  roomId = req.params.roomId;
  const { sender,message } = req.body;
  try {
    const newMessage = new RoomMessage({
      roomId: roomId,
      sender: sender,
      message: message
    });
    console.log(roomId,sender,message);
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error saving message to room' });
  }
});

router.get('/:roomId/messages', authMiddleware, async (req, res) => {
    const { roomId } = req.params;
  
    try {
      const messages = await RoomMessage.find({ roomId }).sort({ timestamp: 1 });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching messages for the room' });
    }
  });
module.exports = router;

