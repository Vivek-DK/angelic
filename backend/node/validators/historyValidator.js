const Joi = require("joi");

exports.historySchema =
  Joi.object({

    imageKey:
      Joi.string()
      .required(),

    analysisName:
      Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required(),

    skinTone:
      Joi.string()
      .required(),

    faceShape:
      Joi.string()
      .required(),

    colors:
      Joi.array()
      .items(Joi.string())
      .required(),

    colorsName:
      Joi.array()
      .items(Joi.string())
      .required(),

    avoidColors:
      Joi.array()
      .items(Joi.string())
      .default([]),

    avoidColorsName:
      Joi.array()
      .items(Joi.string())
      .default([])
  });