const express = require("express");

const crypto = require("crypto");

const auth = require("../middleware/auth");

const s3 = require("../utils/s3");

const {
  PutObjectCommand
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const router = express.Router();


// ==========================================
// GENERATE S3 UPLOAD URL
// ==========================================

router.post(

  "/generate-url",

  auth,

  async (req, res, next) => {

    try {

      const {
        fileType
      } = req.body;


      // ======================================
      // VALIDATION
      // ======================================

      if (!fileType) {

        return res.status(400).json({

          success: false,

          message:
            "fileType is required"
        });
      }


      // ======================================
      // IMAGE KEY
      // ======================================

      const imageKey =

        `users/${req.userId}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;


      // ======================================
      // S3 COMMAND
      // ======================================

      const command =
        new PutObjectCommand({

          Bucket:
            process.env.AWS_BUCKET_NAME,

          Key:
            imageKey,

          ContentType:
            fileType
        });


      // ======================================
      // SIGNED URL
      // ======================================

      const uploadUrl =
        await getSignedUrl(

          s3,

          command,

          {
            expiresIn: 300
          }
        );


      // ======================================
      // PUBLIC IMAGE URL
      // ======================================

      const imageUrl =

        `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;


      // ======================================
      // RESPONSE
      // ======================================

      res.status(200).json({

        success: true,

        uploadUrl,

        imageKey,

        imageUrl
      });

    } catch (err) {

      console.error(err);

      next(err);
    }
  }
);

module.exports = router;