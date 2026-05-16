const express = require("express");

const History = require("../models/History");

const auth = require("../middleware/auth");

const validate = require(
  "../middleware/validate"
);

const {
  historySchema
} = require(
  "../validators/historyValidator"
);

const generateViewUrl = require(
  "../utils/generateViewUrl"
);

const {
  DeleteObjectCommand
} = require(
  "@aws-sdk/client-s3"
);

const s3 = require(
  "../utils/s3"
);

const router = express.Router();


// ==========================================
// ADD HISTORY
// ==========================================

router.post(

  "/add",

  auth,

  validate(historySchema),

  async (req, res, next) => {

    try {

      const {

        analysisName,

        imageKey,

        skinTone,

        faceShape,

        colors,

        colorsName,

        avoidColors,

        avoidColorsName

      } = req.body;


      const entry =
        await History.create({

          userId:
            req.userId,

          analysisName,

          imageKey,

          skinTone,

          faceShape,

          colors,

          colorsName,

          avoidColors,

          avoidColorsName
        });


      // ======================================
      // SOCKET EVENT
      // ======================================

      const io =
        req.app.get("io");

      io.emit(

        "analysis_completed",

        {

          message:
            "New analysis completed",

          analysisId:
            entry._id,

          faceShape:
            entry.faceShape,

          skinTone:
            entry.skinTone
        }
      );


      res.status(201).json({

        success: true,

        data: entry
      });

    } catch (err) {

      console.error(

        "Save history error:",

        err
      );

      next(err);
    }
  }
);


// ==========================================
// FETCH ALL HISTORY
// ==========================================

router.get(

  "/all",

  auth,

  async (req, res) => {

    try {

      const {

        search = ""

      } = req.query;


      const query = {

        userId:
          req.userId
      };


      if (search.trim()) {

        query.analysisName = {

          $regex: search,

          $options: "i"
        };
      }


      const histories =
        await History.find(query)

          .sort({

            createdAt: -1
          });


      const formattedHistories =

        await Promise.all(

          histories.map(

            async (item) => ({

              ...item.toObject(),

              imageUrl:

                await generateViewUrl(
                  item.imageKey
                )
            })
          )
        );


      res.status(200).json({

        success: true,

        data: formattedHistories
      });

    } catch (err) {

      console.error(

        "Fetch history error:",

        err
      );

      res.status(500).json({

        success: false,

        message:
          "Failed to fetch history"
      });
    }
  }
);


// ==========================================
// FETCH SINGLE HISTORY
// ==========================================

router.get(

  "/:id",

  auth,

  async (req, res, next) => {

    try {

      const history =
        await History.findOne({

          _id:
            req.params.id,

          userId:
            req.userId
        });


      if (!history) {

        return res.status(404).json({

          success: false,

          message:
            "History not found"
        });
      }


      const formattedHistory = {

        ...history.toObject(),

        imageUrl:

          await generateViewUrl(
            history.imageKey
          )
      };


      res.status(200).json({

        success: true,

        data: formattedHistory
      });

    } catch (err) {

      next(err);
    }
  }
);


// ==========================================
// DELETE HISTORY
// ==========================================

router.delete(

  "/delete/:id",

  auth,

  async (req, res, next) => {

    try {

      const history =
        await History.findOne({

          _id:
            req.params.id,

          userId:
            req.userId
        });


      // ================================
      // NOT FOUND
      // ================================

      if (!history) {

        return res.status(404).json({

          success: false,

          message:
            "History not found"
        });
      }


      // ================================
      // DELETE S3 IMAGE
      // ================================

      if (history.imageKey) {

        const deleteCommand =
          new DeleteObjectCommand({

            Bucket:
              process.env.AWS_BUCKET_NAME,

            Key:
              history.imageKey
          });

        await s3.send(
          deleteCommand
        );
      }


      // ================================
      // DELETE MONGODB ENTRY
      // ================================

      await History.deleteOne({

        _id:
          req.params.id
      });


      // ================================
      // RESPONSE
      // ================================

      res.status(200).json({

        success: true,

        message:
          "History deleted successfully"
      });

    } catch (err) {

      console.error(
        "Delete history error:",
        err
      );

      next(err);
    }
  }
);

module.exports = router;