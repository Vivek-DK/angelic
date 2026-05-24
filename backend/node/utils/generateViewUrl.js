const {

  GetObjectCommand

} = require(
  "@aws-sdk/client-s3"
);

const {

  getSignedUrl

} = require(
  "@aws-sdk/s3-request-presigner"
);

const s3 =
  require("./s3");

const generateViewUrl =
  async (imageKey) => {

    const command =

      new GetObjectCommand({

        Bucket:
          process.env
            .AWS_BUCKET_NAME,

        Key: imageKey
      });

    return getSignedUrl(

      s3,

      command,

      {

        expiresIn: 3600
      }
    );
  };

module.exports =
  generateViewUrl;