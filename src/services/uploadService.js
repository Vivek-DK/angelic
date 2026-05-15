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
  async (uploadUrl, file) => {

    await axios.put(
      uploadUrl,
      file,
      {
        headers: {
          "Content-Type":
            file.type
        }
      }
    );
  };