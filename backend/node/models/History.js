const mongoose = require('mongoose');


const HistorySchema =
  new mongoose.Schema({

    userId: {
      type: String,
      required: true
    },

    analysisName: {
      type: String,
      required: true
    },

    imageKey: {
      type: String,
      required: true
    },

    imageUrl: {
      type: String
    },

    skinTone: String,

    faceShape: String,

    colors: [String],

    colorsName: [String],

    avoidColors: [String],

    avoidColorsName: [String]

  }, {

    timestamps: true
  });

  module.exports = mongoose.model("History", HistorySchema)