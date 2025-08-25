import axios from "axios";

const API_URL = import.meta.env.VITE_PYTHON_URL;

export const sendMessage = async (message) => {
  const res = await axios.post(`${API_URL}/api/chat`, {
    message: message.text
  }, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  return res.data;
};
