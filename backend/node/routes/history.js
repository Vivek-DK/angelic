const express = require('express');
const multer = require('multer');
const History = require('../models/History');
const auth = require('../middleware/auth');
const validate = require(
  "../middleware/validate"
);

const { historySchema } = require("../validators/historyValidator");

const router = express.Router();

const parseHistoryFields = ( req, res, next ) => {

  try {

    if (req.body.colors) {

      req.body.colors = JSON.parse(
        req.body.colors
      );
    }

    if (req.body.colorsName) {

      req.body.colorsName = JSON.parse(
        req.body.colorsName
      );
    }

    next();

  } catch (err) {

    return res.status(400).json({

      success: false,

      message:
        "Invalid colors format"
    });
  }
};

// POST /api/history/add
router.post(

  "/add",

  auth,

  parseHistoryFields,

  validate(historySchema),

  async (req, res, next) => {

    try {

      const { analysisName, skinTone, faceShape, colors, colorsName } = req.body;

      const entry = await History.create({

        userId: req.userId,

        imageKey,

        analysisName,

        skinTone,

        faceShape,

        colors,

        colorsName
      });

      const io = req.app.get("io");

      io.emit("analysis_completed", {

        message:
          "New analysis completed",

        analysisId: entry._id,

        faceShape:
          entry.faceShape,
        
        skinTone:
          entry.skinTone

      });

      res.status(201).json({ 
        success: true,
        data: entry
      });

    } catch (err) {
      next(err);
    }
  }
);

// GET /api/history/all
router.get(
  "/all",
  auth,
  async (req, res) => {

    try {

      const {

        search = ""

      } = req.query;


      // ======================================
      // QUERY
      // ======================================

      const query = {

        userId: req.userId,

        deleted: {
          $ne: true
        }
      };


      // ======================================
      // SEARCH FILTER
      // ======================================

      if (search.trim()) {

        query.analysisName = {

          $regex: search,

          $options: "i"
        };
      }


      // ======================================
      // FETCH
      // ======================================

      const histories =
        await History.find(query)

          .sort({
            date: -1
          });


      res.status(200).json(
        histories
      );

    } catch (err) {

      console.error(

        "Fetch history error:",

        err
      );

      res.status(500).json({

        message:
          "Failed to fetch history"
      });
    }
  }
);

// GET /api/history/:id  → Get specific history entry for logged-in user
router.get(

  "/:id",

  auth,

  async (req, res, next) => {

    try {

      const history =
        await History.findOne({

          _id: req.params.id,

          userId: req.userId,

          deleted: {
            $ne: true
          }
        });

      if (!history) {

        return res.status(404).json({

          success: false,

          message:
            "History not found"
        });
      }

      res.status(200).json({

        success: true,

        data: history
      });

    } catch (err) {

      next(err);
    }
  }
);

router.delete(

  "/delete/:id",

  auth,

  async (req, res, next) => {

    try {

      const history =
        await History.findOne({

          _id: req.params.id,

          userId: req.userId
        });

      if (!history) {

        return res.status(404).json({

          success: false,

          message: "History not found"
        });
      }

      if (history.cloudinaryId) {

        await cloudinary
          .uploader
          .destroy(
            history.cloudinaryId
          );
      }

      await History.deleteOne({

        _id: req.params.id,

        userId: req.userId
      });

      res.status(200).json({

        success: true,

        message:
          "History deleted successfully"
      });

    } catch (err) {

      next(err);
    }
  }
);  

module.exports = router;
