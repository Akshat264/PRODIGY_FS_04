const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for Room Messages
const RoomMessageSchema = new Schema({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create the model from the schema
const RoomMessage = mongoose.model('RoomMessage', RoomMessageSchema);

module.exports = RoomMessage;