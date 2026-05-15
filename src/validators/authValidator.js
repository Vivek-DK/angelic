import Joi from "joi";


// ==========================================
// LOGIN VALIDATION
// ==========================================

export const loginSchema =
  Joi.object({

    email: Joi.string()

      .email({

        tlds: {
          allow: false
        }
      })

      .required()

      .messages({

        "string.empty":
          "Email is required",

        "string.email":
          "Invalid email format"
      }),

    password: Joi.string()

      .min(6)

      .required()

      .messages({

        "string.empty":
          "Password is required",

        "string.min":
          "Password must be at least 6 characters"
      })
  });


// ==========================================
// SIGNUP VALIDATION
// ==========================================

export const signupSchema =
  Joi.object({

    name: Joi.string()

      .min(2)

      .max(30)

      .required()

      .messages({

        "string.empty":
          "Name is required",

        "string.min":
          "Name must be at least 2 characters"
      }),

    email: Joi.string()

      .email({

        tlds: {
          allow: false
        }
      })

      .required()

      .messages({

        "string.empty":
          "Email is required",

        "string.email":
          "Invalid email format"
      }),

    password: Joi.string()

      .min(6)

      .max(30)

      .pattern(
        /^(?=.*[A-Za-z])(?=.*\d).+$/
      )

      .required()

      .messages({

        "string.empty":
          "Password is required",

        "string.min":
          "Password must be at least 6 characters",

        "string.pattern.base":
          "Password must contain letters and numbers"
      }),

    otp: Joi.string()

      .length(6)

      .messages({

        "string.length":
          "OTP must be 6 digits"
      })
  });