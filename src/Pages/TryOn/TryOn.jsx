import React from 'react';
import './TryOn.css';
import { FaCameraRetro, FaTools, FaClock } from 'react-icons/fa';

const TryOn = () => {
  return (
    <div className="tryon-container">
      <FaCameraRetro className="icon shirt-icon pulse" />
      <h1>Virtual Try-On</h1>
      <p>
        <FaTools className="icon spin" />
        <span className="coming-text">Coming Soon...</span>
        <FaClock className="icon" />
      </p>
    </div>
  );
};

export default TryOn;
