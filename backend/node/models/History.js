const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true
  },
  imageKey: {
    type: String,
    required: true
  },

  analysisName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  skinTone: String,
  faceShape: String,
  colors: [String],
  colorsName: [String],
  date: { 
    type: Date, 
    default: Date.now 
  },
  deleted: { 
    type: Boolean, 
    default: false 
  } 
});


module.exports = mongoose.model('History', HistorySchema);
