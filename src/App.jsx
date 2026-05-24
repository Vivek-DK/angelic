import React, {

  useEffect,

  useState

} from "react";

import {

  BrowserRouter,

  Routes,

  Route

} from "react-router-dom";

import {

  ToastContainer

} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";


// ==========================================
// CONTEXT
// ==========================================

import {

  UserProvider

} from "./context/UserContext";


// ==========================================
// HOOKS
// ==========================================

import useSocketNotifications from "./hooks/useSocketNotifications";


// ==========================================
// COMPONENTS
// ==========================================

import Navbar from "./Components/Navbar/Navbar";

import PrivateRoute from "./Components/PrivateRoute";

import ChatWindow from "./Components/Chat-bot/ChatWindow";


// ==========================================
// PAGES
// ==========================================

import Home from "./Pages/Home/Home";

import Analysis from "./Pages/Analysis/Analysis";

import Contact from "./Pages/Contact/Contact";

import Features from "./Pages/Features/Features";

import Login from "./Pages/AuthForms/Login";

import Signup from "./Pages/AuthForms/Signup";

import Dashboard from "./Pages/Dashborad/Dashborad";

import Result from "./Components/Results/Results";

import UserProfile from "./Components/UserProfile/UserProfile";

import ReportPage from "./Pages/ReportPage/ReportPage";


// ==========================================
// ROUTES
// ==========================================

const AppRoutes = ({ theme }) => {

  return (

    <Routes>

      <Route

        path="/"

        element={

          <Home

            theme={theme}

            key={theme}
          />
        }
      />

      <Route

        path="/analysis"

        element={<Analysis />}
      />

      <Route

        path="/contact"

        element={<Contact />}
      />

      <Route

        path="/features"

        element={<Features />}
      />

      <Route

        path="/login"

        element={<Login />}
      />

      <Route

        path="/signup"

        element={<Signup />}
      />

      <Route

        path="/results"

        element={<Result />}
      />

      <Route

        path="/report/:id"

        element={<ReportPage />}
      />

      {/* ======================================
          PRIVATE ROUTES
      ====================================== */}

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

    </Routes>
  );
};


// ==========================================
// APP
// ==========================================

const App = () => {

  const [theme, setTheme] =
    useState(

      localStorage.getItem(
        "theme"
      ) || "light"
    );


  // ========================================
  // SOCKET NOTIFICATIONS
  // ========================================

  useSocketNotifications();


  // ========================================
  // THEME
  // ========================================

  useEffect(() => {

    document.body.className =
      theme;

    localStorage.setItem(
      "theme",
      theme
    );

  }, [theme]);


  return (

    <BrowserRouter>

      <UserProvider>

        <div className={`app ${theme}`}>

          {/* ================================
              TOAST
          ================================= */}

          <ToastContainer

            position="top-right"

            autoClose={3000}
          />


          {/* ================================
              NAVBAR
          ================================= */}

          <Navbar

            theme={theme}

            setTheme={setTheme}
          />


          {/* ================================
              ROUTES
          ================================= */}

          <AppRoutes

            theme={theme}
          />


          {/* ================================
              AI CHATBOT
          ================================= */}

          <ChatWindow />

        </div>

      </UserProvider>

    </BrowserRouter>
  );
};

export default App;