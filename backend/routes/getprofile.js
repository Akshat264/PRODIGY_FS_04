const express = require('express');
const bodyParser = require('body-parser');
require("dotenv").config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const PORT = process.env.PORT || 3000;
const crypto = require("crypto");
const moment=require("moment");
const nodemailer=require("nodemailer");
const ResetToken = require("../Models/resetpassword_model");
const User=require("../Models/usermodel");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware= require("../verifyToken.js");
const Message = require("../Models/message.js");
router.get('/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.id } }).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// routes/chat.js

// Fetch messages between two users
router.get('/messages/:receiverId', authMiddleware, async (req, res) => {
    try {
        const { receiverId } = req.params;
        const messages = await Message.find({
            $or: [
                { sender: req.id, receiver: receiverId },
                { sender: receiverId, receiver: req.id },
            ],
        }).sort({ timestamp: 1 }); // sort by timestamp in ascending order

        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;