// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Components/Navbar/Navbar";
import Home from "./Pages/Home/Home";
import Analysis from "./Pages/Analysis/Analysis";
import Contact from "./Pages/Contact/Contact";
import Features from "./Pages/Features/Features";
import TryOn from "./Pages/TryOn/TryOn";
import Login from "./Pages/AuthForms/Login";
import Signup from "./Pages/AuthForms/Signup";
import Dashboard from "./Pages/Dashborad/Dashborad";
import UserProfile from "./Components/UserProfile/UserProfile";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Result from "./Components/Results/Results";
import PrivateRoute from "./Components/PrivateRoute";
import { UserProvider } from "./context/UserContext";
import ChatWindow from "./Components/Chat-bot/ChatWindow";
import StyledReport from "./Components/StyledReport/StyledReport";
const AppRoutes = ({theme}) => {
  return (
    <Routes>
      <Route path="/" element={<Home theme={theme} key={theme}/>} />
      <Route path="/analysis" element={<Analysis />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/features" element={<Features />} />
      <Route path="/try-on" element={<TryOn />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
       <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/user-profile"
        element={
          <PrivateRoute>
            <UserProfile />
          </PrivateRoute>
        }
      />
      <Route path="/results" element={<Result />} />
      <Route path="/report/:id" element={<StyledReport />} />
    </Routes>
  );
};

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
      <BrowserRouter>
        <UserProvider>
          <div className={`app ${theme}`}>
            <ToastContainer position="top-right" autoClose={3000} />
            <Navbar theme={theme} setTheme={setTheme} />
            <AppRoutes theme={theme}/>
            <ChatWindow />
          </div>
          </UserProvider>
      </BrowserRouter>
  );
};

export default App;
