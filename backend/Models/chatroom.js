// models/Room.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
    name: { type: String, required: true, unique: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of user IDs who have joined the room
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true, // Adds createdAt and updatedAt timestamps
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
