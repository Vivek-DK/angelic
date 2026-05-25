import axios from "axios";

const PYTHON_API = 'http://127.0.0.1:8000';

export const analyzeImage =
  async (file) => {

    const formData =
      new FormData();

    formData.append(
      "image_file",
      file
    );

    const response =
      await axios.post(

        `${PYTHON_API}/stone`,

        formData,

        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

    return response.data;
  };