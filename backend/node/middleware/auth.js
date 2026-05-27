const jwt = require("jsonwebtoken");

const User = require("../models/User");

const auth = async (
  req,
  res,
  next
) => {

  try {

    const authHeader =
      req.headers.authorization;

    if (

      !authHeader ||

      !authHeader.startsWith(
        "Bearer "
      )

    ) {

      return res.status(401).json({

        success: false,

        message:
          "Unauthorized"
      });
    }

    const token =
      authHeader.split(" ")[1];

    const decoded =
      jwt.verify(

        token,

        process.env.JWT_SECRET
      );

    const user =
      await User.findById(
        decoded.id
      ).select("-password");

    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "User not found"
      });
    }

    req.user = user;

    next();

  } catch (error) {

    console.log(
      "AUTH ERROR:",
      error
    );

    return res.status(403).json({

      success: false,

      message:
        "Invalid token"
    });
  }
};

module.exports = auth;