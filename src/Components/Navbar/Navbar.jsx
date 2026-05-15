import React, {

  useState,

  useContext,

  useRef,

  useEffect

} from "react";

import {

  NavLink,

  useNavigate

} from "react-router-dom";

import "./Navbar.css";

import {

  FontAwesomeIcon

} from "@fortawesome/react-fontawesome";

import {

  faMoon,

  faSun,

  faRightToBracket,

  faUserPlus,

  faHome,

  faChartLine,

  faSquarePollHorizontal,

  faAddressBook

} from "@fortawesome/free-solid-svg-icons";

import {

  UserContext

} from "../../context/UserContext";

import userPic from "../../assets/user.png";

import {

  motion,

  AnimatePresence

} from "framer-motion";


// ==========================================
// DROPDOWN ANIMATION
// ==========================================

const dropdownVariants = {

  hidden: {

    opacity: 0,

    y: -10,

    scale: 0.95,

    transition: {

      duration: 0.2,

      ease: "easeOut"
    }
  },

  visible: {

    opacity: 1,

    y: 0,

    scale: 1,

    transition: {

      duration: 0.25,

      ease: "easeOut"
    }
  },

  exit: {

    opacity: 0,

    y: -10,

    scale: 0.95,

    transition: {

      duration: 0.2,

      ease: "easeIn"
    }
  }
};


const Navbar = ({
  theme,
  setTheme
}) => {

  const navigate =
    useNavigate();

  const {

    user

  } = useContext(
    UserContext
  );


  // ==========================================
  // STATES
  // ==========================================

  const [dropdownOpen,
    setDropdownOpen] =
      useState(false);

  const profileRef =
    useRef(null);


  // ==========================================
  // CLOSE OUTSIDE CLICK
  // ==========================================

  useEffect(() => {

    const handleClickOutside =
      (e) => {

        if (

          profileRef.current &&

          !profileRef.current.contains(
            e.target
          )

        ) {

          setDropdownOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {

      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);


  // ==========================================
  // NAV ITEMS
  // ==========================================

  const navElements = [

    {
      name: "Home",
      path: "/",
      icon: faHome,
      tooltip: "Go to Homepage"
    },

    {
      name: "Analysis",
      path: "/analysis",
      icon: faChartLine,
      tooltip: "Analyze your face"
    },

    {
      name: "Results",
      path: "/results",
      icon: faSquarePollHorizontal,
      tooltip: "View results"
    },

    {
      name: "Contact",
      path: "/contact",
      icon: faAddressBook,
      tooltip: "Contact us"
    }
  ];


  return (

    <nav className="navbar">


      {/* ================================= */}
      {/* LEFT */}
      {/* ================================= */}

      <div className="nav-left">

        <h2
          onClick={() =>
            navigate("/")
          }
          style={{
            cursor: "pointer"
          }}
        >

          ANGELIC

        </h2>

      </div>


      {/* ================================= */}
      {/* CENTER */}
      {/* ================================= */}

      <div className="nav-center">

        <ul>

          {navElements.map(

            (el, index) => (

              <li key={index}>

                <NavLink

                  to={el.path}

                  data-tooltip={
                    el.tooltip
                  }

                  className={

                    ({ isActive }) =>

                      isActive

                        ? "nav-link active"

                        : "nav-link"
                  }
                >

                  <FontAwesomeIcon
                    icon={el.icon}
                  />

                  {el.name}

                </NavLink>

              </li>
            )
          )}

        </ul>

      </div>


      {/* ================================= */}
      {/* RIGHT */}
      {/* ================================= */}

      <div className="nav-right">


        {/* AUTH BUTTONS */}

        {!user && (

          <>

            <button

              className="login"

              onClick={() =>
                navigate("/login")
              }
            >

              <FontAwesomeIcon
                icon={
                  faRightToBracket
                }
              />

              Login

            </button>


            <button

              className="login"

              onClick={() =>
                navigate("/signup")
              }
            >

              <FontAwesomeIcon
                icon={faUserPlus}
              />

              Sign Up

            </button>

          </>
        )}


        {/* THEME TOGGLE */}

        <div className=
          "tooltip-container"
        >

          <button

            className="toggle-mode"

            onClick={() =>

              setTheme(

                theme === "light"

                  ? "dark"

                  : "light"
              )
            }
          >

            {theme === "light"

              ? (
                <FontAwesomeIcon
                  icon={faMoon}
                />
              )

              : (
                <FontAwesomeIcon
                  icon={faSun}
                />
              )}

          </button>

        </div>


        {/* PROFILE */}

        {user && (

          <div

            className="profile-wrapper"

            ref={profileRef}
          >

            <div className=
              "tooltip-container"
            >

              <p

                className=
                  "profile-avatar"

                onClick={() =>

                  setDropdownOpen(
                    !dropdownOpen
                  )
                }
              >

                {(

                  user?.name?.charAt(0) ||

                  user?.email?.charAt(0) ||

                  "U"

                ).toUpperCase()}

              </p>

              <span className=
                "tooltip-text"
              >

                Profile

              </span>

            </div>


            <AnimatePresence>

              {dropdownOpen && (

                <motion.div

                  className={

                    `profile-dropdown modern ${theme}`
                  }

                  initial="hidden"

                  animate="visible"

                  exit="exit"

                  variants={
                    dropdownVariants
                  }
                >

                  <img

                    src={userPic}

                    alt="User"

                    className=
                      "profile-image"
                  />

                  <p className=
                    "profile-name"
                  >

                    {

                      user.name ||

                      "Unnamed User"
                    }

                  </p>

                  <p className=
                    "profile-email"
                  >

                    {user.email}

                  </p>


                  {/* DASHBOARD */}

                  <button

                    className=
                      "dashboard-btn"

                    onClick={() => {

                      navigate(
                        "/dashboard"
                      );

                      setDropdownOpen(
                        false
                      );
                    }}
                  >

                    Your Dashboard

                  </button>


                  {/* ACCOUNT */}

                  <button

                    className=
                      "account-btn"

                    onClick={() => {

                      navigate(
                        "/user-profile"
                      );

                      setDropdownOpen(
                        false
                      );
                    }}
                  >

                    Manage your Account

                  </button>

                </motion.div>
              )}

            </AnimatePresence>

          </div>
        )}


        {/* ================================= */}
        {/* MOBILE NAV */}
        {/* ================================= */}

        <div className="mobile-nav">

          {navElements.map(

            (el, index) => (

              <NavLink

                key={index}

                to={el.path}

                className={

                  ({ isActive }) =>

                    isActive

                      ? "mobile-nav-link active"

                      : "mobile-nav-link"
                }
              >

                <FontAwesomeIcon
                  icon={el.icon}
                />

                <span>

                  {el.name}

                </span>

              </NavLink>
            )
          )}

        </div>

      </div>

    </nav>
  );
};

export default Navbar;