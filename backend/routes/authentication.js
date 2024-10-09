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
const uri=process.env.URL;
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures',
    allowedFormats: ['jpeg', 'png', 'jpg'],
  },
});
// Generate a random token
function generateToken() {
    return crypto.randomBytes(20).toString('hex');
  }
// User Registration API
const maxTime=24*3600;
router.post('/register', async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, username, password: hashedPassword });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, 'secret_key',{expiresIn: maxTime});
        res.cookie('jwt', token, {
          httpOnly: true, // Ensures the cookie is not accessible via JavaScript
          secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
          sameSite: 'None', // Allow cross-site cookies (important if frontend and backend have different origins)
          maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
      });
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// User Login API
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        const token = jwt.sign({ userId: user._id }, 'secret_key',{expiresIn: maxTime});
        res.cookie('jwt', token, {
          httpOnly: true, // Ensures the cookie is not accessible via JavaScript
          secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
          sameSite: 'None', // Allow cross-site cookies (important if frontend and backend have different origins)
          maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
      });
        res.json({ message: 'Login successful', user: user, token: token});
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Forgot Password API
router.post('/forgot-password', async (req, res) => {
    const {email}=req.body;
    const token=generateToken();
    const expires = moment().add(1, 'hour').toDate();

    try {
      // Save reset token to MongoDB
      await ResetToken.create({ email, token, expires });
  
      // Create Nodemailer transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 's6akshat2110045@gmail.com',
          pass: process.env.PASSWORD,
        }
      });
  
      // Send email with reset password link
      const mailOptions = {
        from: 'akshat2110045@akgec.ac.in',
        to: email,
        subject: 'Reset Password',
        text: `Click on the following link to reset your password: ${uri}/reset-password/${token}`
      };
  
      await transporter.sendMail(mailOptions);
      console.log('Reset password link sent to email:', email);
      res.json({ message: 'Reset password link sent to your email' });
    } catch (error) {
      console.error('Error sending reset password email:', error);
      res.status(500).json({ error: 'Failed to send reset password email' });
    }
    
});
router.route("/verify-token").get(async(req,res)=>{
  const token = req.cookies.jwt; 
  console.log(token);
  if (!token) {
      return res.status(401).json({ message: 'Token not found' });
  }
  // Verify token
  jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
          return res.status(401).json({ message: 'Invalid token' });
      } else {
          // Token is valid, set req.user with decoded user information
          req.user = decoded;
          return res.status(200).json({message: 'Token Verified'});
      }
  });
})
router.route('/reset/:token').get( async (req, res) => {
    const { token } = req.params; 
    try {
      // Find reset token in MongoDB
      const resetToken = await ResetToken.findOne({ token });
  
      // Check if token exists and is not expired
      if (resetToken && moment().isBefore(resetToken.expires)) {
        // Allow user to reset password
        res.render("temp"); // Render reset password form
      } else {
        // Token is invalid or expired
        res.status(400).send('Invalid or expired reset password link');
      }
    } catch (error) {
      console.error('Error finding reset token:', error);
      res.status(500).json({ error: 'Failed to find reset token' });
    }
  }).post(async (req,res)=>{
    const {token}=req.params;
    const {newpass}=req.body;
    //encrypt the new password
    const hashedPassword = await bcrypt.hash(newpass, 10);
    try{
        const user_reset = await ResetToken.findOne({ token });
        const email=user_reset.email;
        const user=await User.findOne({email});
        user.password=hashedPassword;
        await user.save();
        // Password updated successfully
        res.send({ message: 'Password updated successfully' });
        }catch(err){
            console.error('Error updating password:', error);
            res.status(500).json({ error: 'Failed to update password' });
        }
  })
  ////// Functionality for editing the profile
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         cb(null, `${req.id}-${Date.now()}${path.extname(file.originalname)}`);
//     }
// });
const upload = multer({ storage });
router.put('/edit-profile',authMiddleware,upload.single('profileImage'), async (req, res) => {
  try {
      const user = await User.findById(req.id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Update user fields
      user.username = req.body.username || user.username;
      user.email = req.body.email || user.email;
      console.log(req.file.path);
      // Update profile image if uploaded
      if (req.file) {
        user.profileImage = req.file.path; // Cloudinary URL
        console.log("saved");
      }
      await user.save();
      res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
      res.status(500).json({ message: 'Server error' });
  }
});
  module.exports = router;