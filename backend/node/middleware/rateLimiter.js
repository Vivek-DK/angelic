const rateLimit = require(
  "express-rate-limit"
);

exports.authLimiter = rateLimit({

  windowMs:
    15 * 60 * 1000,

  max: 10,

  message: {
    success: false,
    message:
      "Too many requests. Try again later."
  }
});

exports.historyLimiter = rateLimit({

  windowMs:
    15 * 60 * 1000,

  max: 50,

  message: {
    success: false,
    message:
      "Too many uploads."
  }
});