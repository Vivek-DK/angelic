const Joi = require("joi");

exports.sendOtpSchema = Joi.object({

  email: Joi.string()
    .email()
    .required()
});

exports.signupSchema = Joi.object({

  name: Joi.string()
    .min(2)
    .max(50)
    .required(),

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .max(30)
    .required(),

  otp: Joi.string()
    .length(6)
    .required()
});

exports.loginSchema = Joi.object({

  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .required()
});