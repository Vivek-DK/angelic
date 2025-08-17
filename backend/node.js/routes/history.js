const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const History = require('../models/History');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'user_histories',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// POST /api/history/add
router.post('/add', auth, upload.single('image'), async (req, res) => {
  try {
    const { skinTone, faceShape, colors, colorsName } = req.body;
    const parsedColors = JSON.parse(colors);
    const parsedColorNames = JSON.parse(colorsName);

    const entry = await History.create({
      userId: req.userId,
      imageUrl: req.file.path,
      cloudinaryId: req.file.filename,
      skinTone,
      faceShape,
      colors: parsedColors,
      colorsName: parsedColorNames,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('History save error:', err);
    res.status(500).json({ message: 'Failed to save analysis' });
  }
});

// GET /api/history/all
router.get('/all', auth, async (req, res) => {
  try {
    const histories = await History.find({
      userId: req.userId,
      deleted: { $ne: true }
    }).sort({ date: -1 });

    res.status(200).json(histories);
  } catch (err) {
    console.error("Fetch history error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/history/:id  → Get specific history entry for logged-in user
router.get('/:id', auth, async (req, res) => {
  try {
    const history = await History.findOne({
      _id: req.params.id,
      userId: req.userId,
      deleted: { $ne: true }
    });

    if (!history) {
      return res.status(404).json({ error: "History not found" });
    }

    res.status(200).json(history);
  } catch (err) {
    console.error("Fetch single history error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/history/delete/:id
router.delete('/delete/:id', auth, async (req, res) => {
  try {
    const history = await History.findOne({ _id: req.params.id, userId: req.userId });

    if (!history) return res.status(404).json({ error: "Not found" });

    if (history.cloudinaryId) {
      await cloudinary.uploader.destroy(history.cloudinaryId);
    }

    const result = await History.deleteOne({ _id: req.params.id, userId: req.userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Nothing deleted." });
    }
    res.status(200).json({ message: "History deleted permanently." });
  } catch (err) {
    console.error("Hard delete error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
