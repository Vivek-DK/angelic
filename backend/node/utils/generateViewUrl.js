const s3 = require("./s3");

const {
  GetObjectCommand
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl
} = require("@aws-sdk/s3-request-presigner");


const generateViewUrl = async (
  imageKey
) => {

  const command =
    new GetObjectCommand({

      Bucket:
        process.env.AWS_BUCKET_NAME,

      Key: imageKey
    });

  return await getSignedUrl(

    s3,

    command,

    {
      expiresIn: 3600
    }
  );
};

module.exports = generateViewUrl;