require('dotenv').config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const nodemailer = require("nodemailer");

const router = express.Router();

const transporter = require("../utils/mailer"); 


router.post("/send-otp", async (req, res) => {
  console.log("SEND-OTP invoked. Body:", req.body);

  try {
    let { email } = req.body;
    if (!email) {
      console.warn("SEND-OTP: Missing email");
      return res.status(400).json({ message: "Email is required", code: "MISSING_EMAIL" });
    }

    email = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.warn("SEND-OTP: Invalid email format:", email);
      return res.status(400).json({ message: "Invalid email format", code: "INVALID_EMAIL" });
    }

    // DB model checks
    if (!User || !Otp) {
      console.error("SEND-OTP: User or Otp model missing");
      return res.status(500).json({ message: "Server misconfiguration", detail: "Models missing" });
    }

    const existingUser = await User.findOne({ email }).catch(e => {
      console.error("SEND-OTP: DB find error:", e);
      throw new Error("DB_LOOKUP_FAIL");
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists", code: "USER_EXISTS" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.deleteMany({ email }).catch(e => console.warn("SEND-OTP: deleteMany warning:", e && e.message));

    await Otp.create({ email, otp, expiresAt }).catch(e => {
      console.error("SEND-OTP: Otp.create error:", e);
      throw new Error("DB_SAVE_FAIL");
    });

    if (!transporter) {
      console.error("SEND-OTP: transporter undefined");
      return res.status(500).json({ message: "Mail transporter not configured" });
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: email,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`
      });
      return res.json({ message: "OTP sent successfully" });
    } catch (mailErr) {
      // Log full error
      console.error("SEND-OTP: sendMail failed:", mailErr);
      // Return detailed short reason to frontend (safe enough for debugging)
      return res.status(500).json({ message: "Failed to send OTP", detail: mailErr && mailErr.message ? mailErr.message : String(mailErr) });
    }

  } catch (err) {
    console.error("SEND-OTP: Uncaught error:", err && err.stack ? err.stack : err);
    if (err.message === "DB_LOOKUP_FAIL") return res.status(500).json({ message: "Database lookup failed" });
    if (err.message === "DB_SAVE_FAIL") return res.status(500).json({ message: "Failed to save OTP" });
    return res.status(500).json({ message: "Failed to send OTP", detail: err.message || String(err) });
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