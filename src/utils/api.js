import axios from 'axios';

const API_BASE = import.meta.env.VITE_NODE_URL;

export const authHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginUser = async (email, password) => {
  try {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Login failed");
  }
};

export const signupUser = async (name, email, password, otp) => {
  try {
    const res = await axios.post(`${API_BASE}/api/auth/signup`, { name, email, password, otp });
    return res.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || "Signup failed");
  }
};

export const saveHistory = async (dataUrl, payload) => {
  const formData = new FormData();
  const blob = await (await fetch(dataUrl)).blob();
  formData.append('image', blob, 'image.jpg');
  formData.append('skinTone', payload.skinTone);
  formData.append('faceShape', payload.faceShape);
  formData.append('colors', JSON.stringify(payload.colors));
  formData.append('colorsName', JSON.stringify(payload.colorsName));

  const res = await axios.post(`${API_BASE}/api/history/add`, formData, {
    headers: {
      ...authHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data;
};

export const fetchUserHistory = async () => {
  const res = await axios.get(`${API_BASE}/api/history/all`, {
    headers: authHeader()
  });
  return res.data;
};
