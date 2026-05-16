import axios from "axios";

const NODE_API =
  import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000';

export const generateUploadUrl =
  async (fileType, token) => {

    const response =
      await axios.post(

        `${NODE_API}/api/upload/generate-url`,

        { fileType },

        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );

    return response.data;
  };


export const uploadToS3 =
  async (
    uploadUrl,
    file
  ) => {

    const response =
      await fetch(

        uploadUrl,

        {
          method: "PUT",
          body: file
        }
      );

    if (!response.ok) {

      const text =
        await response.text();

      console.error(text);

      throw new Error(
        "S3 upload failed"
      );
    }
  };