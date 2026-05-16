import axios from "axios";

const API_URL =

  import.meta.env.VITE_PYTHON_API_URL ||

  "http://127.0.0.1:8000";


// ==========================================
// SEND MESSAGE
// ==========================================

export const sendMessage =
  async ({

    message,

    skinTone,

    faceShape,

    season

  }) => {

    try {

      const token =
        localStorage.getItem(
          "token"
        );


      // ======================================
      // REQUEST
      // ======================================

      const response =
        await axios.post(

          `${API_URL}/api/chat`,

          {

            message,

            skinTone,

            faceShape,

            season
          },

          {

            headers: {

              "Content-Type":
                "application/json",

              Authorization:
                token
                  ? `Bearer ${token}`
                  : undefined
            }
          }
        );


      // ======================================
      // RETURN RESPONSE
      // ======================================

      return response.data;

    } catch (err) {

      console.error(

        "Chat API Error:",

        err.response?.data ||

        err.message
      );


      // ======================================
      // CLEAN ERROR MESSAGE
      // ======================================

      return {

        type: "error",

        data:

          err.response?.data?.data ||

          "Failed to get AI response."
      };
    }
};