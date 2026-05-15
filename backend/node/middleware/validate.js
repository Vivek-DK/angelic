module.exports = (schema) => {

  return (req, res, next) => {

    const { error } = schema.validate(
      req.body,
      {
        abortEarly: false,
        allowUnknown: false,
      }
    );

    if (error) {

      return res.status(400).json({

        success: false,

        errors: error.details.map(
          (detail) => detail.message
        ),
      });
    }

    next();
  };
};