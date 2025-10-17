const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  imageUrl: { type: String, required: true },
  cloudinaryId: { type: String }, 
  skinTone: String,
  faceShape: String,
  colors: [String],
  colorsName: [String],
  date: { type: Date, default: Date.now },
  deleted: { type: Boolean, default: false } 
});


module.exports = mongoose.model('History', HistorySchema);
