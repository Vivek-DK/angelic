import React, {

  createContext,

  useEffect,

  useState

} from "react";

import axios from "axios";

import {

  loginUser,

  signupUser

} from "../utils/api";


export const UserContext =
  createContext();


export const UserProvider = ({
  children
}) => {

  const [user, setUser] =
    useState(null);

  const [token, setToken] =
    useState(null);

  const [loading, setLoading] =
    useState(true);


  // =========================================
  // SET AUTH HEADER
  // =========================================

  const setAuthHeader = (
    authToken
  ) => {

    if (authToken) {

      axios.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authToken}`;

    } else {

      delete axios.defaults
        .headers
        .common["Authorization"];
    }
  };


  // =========================================
  // LOGIN
  // =========================================

  const login = async (
    email,
    password
  ) => {

    try {

      const response =
        await loginUser(
          email,
          password
        );

      const {
        token,
        user
      } = response;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      setAuthHeader(token);

      setToken(token);

      setUser(user);

      return response;

    } catch (err) {

      console.error(
        "Login failed:",
        err
      );

      throw err;
    }
  };


  // =========================================
  // SIGNUP
  // =========================================

  const signup = async (
    name,
    email,
    password,
    otp
  ) => {

    try {

      const response =
        await signupUser(

          name,

          email,

          password,

          otp
        );

      const {
        token,
        user
      } = response;

      localStorage.setItem(
        "token",
        token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      setAuthHeader(token);

      setToken(token);

      setUser(user);

      return response;

    } catch (err) {

      console.error(
        "Signup failed:",
        err
      );

      throw err;
    }
  };


  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    setAuthHeader(null);

    setUser(null);

    setToken(null);
  };


  // =========================================
  // RESTORE SESSION
  // =========================================

  useEffect(() => {

    const storedToken =
      localStorage.getItem(
        "token"
      );

    const storedUser =
      localStorage.getItem(
        "user"
      );

    if (
      storedToken &&
      storedUser
    ) {

      try {

        const parsedUser =
          JSON.parse(
            storedUser
          );

        setAuthHeader(
          storedToken
        );

        setToken(
          storedToken
        );

        setUser(
          parsedUser
        );

      } catch (err) {

        console.error(
          "Session restore failed:",
          err
        );

        logout();
      }
    }

    setLoading(false);

  }, []);


  // =========================================
  // CONTEXT VALUE
  // =========================================

  const value = {

    user,

    token,

    loading,

    login,

    signup,

    logout,

    isAuthenticated:
      !!user
  };


  return (

    <UserContext.Provider
      value={value}
    >

      {children}

    </UserContext.Provider>
  );
};