import imageCompression from "browser-image-compression";

const optimizeImage = async (
  file
) => {

  try {

    const options = {

      maxSizeMB: 1,

      maxWidthOrHeight: 1200,

      useWebWorker: true,

      fileType: "image/jpeg",

      initialQuality: 0.8
    };

    const compressedFile =

      await imageCompression(

        file,

        options
      );


    // ======================================
    // SAFELY CREATE JPEG FILE
    // ======================================

    const jpegBlob = new Blob(

      [compressedFile],

      {

        type: "image/jpeg"
      }
    );


    const finalFile = new File(

      [jpegBlob],

      `${Date.now()}.jpg`,

      {

        type: "image/jpeg"
      }
    );


    console.log(

      "Original Size:",

      (
        file.size /
        1024 /
        1024
      ).toFixed(2),

      "MB"
    );

    console.log(

      "Optimized Size:",

      (
        finalFile.size /
        1024 /
        1024
      ).toFixed(2),

      "MB"
    );

    console.log(

      "Optimized Type:",

      finalFile.type
    );


    return finalFile;

  } catch (err) {

    console.error(

      "Image optimization failed:",

      err
    );

    return file;
  }
};

export default optimizeImage;