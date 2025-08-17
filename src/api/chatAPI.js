import axios from "axios";

export const sendMessage = async (message) => {
  const res = await axios.post("http://localhost:8000/api/chat", {
    message: message.text 
  }, {
    headers: {
      "Content-Type": "application/json"
    }
  });

  return res.data;
};
