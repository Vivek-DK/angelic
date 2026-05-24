import axios from "axios";


// ==========================================
// AXIOS INSTANCE
// ==========================================

const api = axios.create({

  baseURL:
    import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000',

  headers: {
    "Content-Type":
      "application/json"
  }
});


// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(

  (config) => {

    const token =
      localStorage.getItem(
        "token"
      );

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);


// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(

  (response) => response,

  (error) => {

    if (
      error.response?.status === 401
    ) {

      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);


// ==========================================
// AUTH API
// ==========================================

export const loginUser =
  async (
    email,
    password
  ) => {

    try {

      const response =
        await api.post(

          "/api/auth/login",

          {
            email,
            password
          }
        );

      return response.data;

    } catch (err) {

      throw new Error(

        err.response?.data?.message ||

        "Login failed"
      );
    }
  };


export const signupUser =
  async (

    name,

    email,

    password,

    otp

  ) => {

    try {

      const response =
        await api.post(

          "/api/auth/signup",

          {

            name,

            email,

            password,

            otp
          }
        );

      return response.data;

    } catch (err) {

      throw new Error(

        err.response?.data?.message ||

        "Signup failed"
      );
    }
  };


// ==========================================
// OTP API
// ==========================================

export const sendOtp =
  async (email) => {

    try {

      const response =
        await api.post(

          "/api/auth/send-otp",

          { email }
        );

      return response.data;

    } catch (err) {

      throw new Error(

        err.response?.data?.message ||

        "OTP send failed"
      );
    }
  };


// ==========================================
// EXPORT AXIOS INSTANCE
// ==========================================

export default api;