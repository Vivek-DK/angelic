import React, { useState, useContext, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoon, faSun, faRightToBracket,
  faUserPlus, faHome,faChartLine,
  faSquarePollHorizontal, faAddressBook,
  faCameraRetro
} from '@fortawesome/free-solid-svg-icons';
import { UserContext } from '../../context/UserContext';
import userPic from '../../assets/user.png';
import { motion, AnimatePresence } from "framer-motion";

const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

const Navbar = ({ theme, setTheme }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const profileRef = useRef(null);

  const toggleMenu = (forceClose = false) => {
    const willBeOpen = forceClose ? false : !menuOpen;
    setMenuOpen(willBeOpen);
    document.body.classList.toggle('menu-open', willBeOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest('.hamburger')
      ) {
        toggleMenu(true);
      }

      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navElements = [
    { name: 'Home', path: '/', icon: faHome, tooltip: 'Go to Homepage' },
    { name: 'Analysis', path: '/analysis', icon: faChartLine, tooltip: 'Get your analysis' },
    { name: 'Results', path: '/results', icon: faSquarePollHorizontal, tooltip: 'Your saved results' },
    { name: 'Try On', path: '/try-on', icon: faCameraRetro, tooltip: 'Try on outfits' },
    { name: 'Contact', path: '/contact', icon: faAddressBook, tooltip: 'Get in touch' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h2>ANJELIC</h2>
      </div>

      <div ref={menuRef} className= "nav-center">
        <ul>
          {navElements.map((el, index) => (
            <li key={index}>
              <NavLink
                to={el.path}
                data-tooltip={el.tooltip}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                <FontAwesomeIcon icon={el.icon} />
                {el.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="nav-right">
        {!user && (
          <>
            <button className="login" onClick={() => navigate('/login')}>
              <FontAwesomeIcon icon={faRightToBracket} /> Login
            </button>
            <button className="login" onClick={() => navigate('/signup')}>
              <FontAwesomeIcon icon={faUserPlus} /> Sign Up
            </button>
          </>
        )}

        <div className="tooltip-container">
          <button className="toggle-mode" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <FontAwesomeIcon icon={faMoon} /> : <FontAwesomeIcon icon={faSun} />}
          </button>
        </div>

        {user && (
          <div className="profile-wrapper" ref={profileRef}>
            <div className="tooltip-container">
              <p
                className="profile-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {(user?.name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase()}
              </p>
              <span className="tooltip-text">Profile</span>
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className={`profile-dropdown modern ${theme}`}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={dropdownVariants}
                >
                  <img src={userPic} alt="User Profile" className="profile-image" />
                  <p className="profile-name">{user.name || 'Unnamed User'}</p>
                  <p className="profile-email">{user.email}</p>

                  <button className="dashboard-btn" onClick={() => navigate("/dashboard")}>
                    Your Dashboard
                  </button>
                  <button className="account-btn" onClick={() => navigate("/user-profile")}>
                    Manage your Account
                  </button>
                </motion.div>
                )}
            </AnimatePresence>

          </div>
        )}

        <div className="mobile-nav">
          {navElements.map((el, index) => (
            <NavLink
              key={index}
              to={el.path}
              className={({ isActive }) => (isActive ? 'mobile-nav-link active' : 'mobile-nav-link')}
            >
              <FontAwesomeIcon icon={el.icon} />
              <span>{el.name}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
