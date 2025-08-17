require('dotenv').config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
}); 

router.post("/send-otp", async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Normalize email to lowercase
    email = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Remove old OTP for this email
    await Otp.deleteMany({ email });

    // Save new OTP in DB
    await Otp.create({ email, otp, expiresAt });

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

router.post("/signup", async (req, res) => {
  let { name, email, password, otp } = req.body;
  email = email.trim().toLowerCase();

  try {
    // Find OTP record in MongoDB
    const stored = await Otp.findOne({ email });

    if (!stored) return res.status(400).json({ message: "OTP not sent" });
    if (stored.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > stored.expiresAt) return res.status(400).json({ message: "OTP expired" });

    // Delete OTP after successful verification
    await Otp.deleteOne({ email });

    // Create new user
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Step 3: Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token,
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;
