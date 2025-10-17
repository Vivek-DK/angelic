import React, { useEffect, useRef, useState } from "react";
import "./Analysis.css";
import { motion } from "framer-motion";
import axios from "axios";
import {
  FaMagic,
  FaPalette,
  FaSmile,
  FaCameraRetro,
  FaTshirt,
  FaUpload,
  FaSpinner,
  FaGem,
  FaStar,
  FaFeather,
  FaSun,
  FaCrown,
  FaLeaf,
  FaHeart
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const quotes = [
  { icon: <FaMagic />, text: "Style is a way to say who you are without speaking." },
  { icon: <FaPalette />, text: "Fashion is art and you are the canvas." },
  { icon: <FaSmile />, text: "Beauty begins the moment you decide to be yourself." },
  { icon: <FaCameraRetro />, text: "One photo, endless styling possibilities." },
  { icon: <FaTshirt />, text: "Let's find your perfect shades!" },
  { icon: <FaGem />, text: "Elegance is not about being noticed, it's about being remembered." },
  { icon: <FaStar />, text: "Your vibe attracts your style." },
  { icon: <FaFeather />, text: "Wear confidence like it's your favorite outfit." },
  { icon: <FaSun />, text: "Colors are the smiles of nature." },
  { icon: <FaCrown />, text: "Own your look, rule your world." },
  { icon: <FaLeaf />, text: "Simplicity is the keynote of true elegance." },
  { icon: <FaHeart />, text: "Love the skin you're in and the style you wear." },
];


const Analysis = () => {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);
  const [imageFile, setImageFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyze, setAnalyze] = useState(false);
  const [error, setError] = useState(null);
  const API_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    const storedImage = localStorage.getItem("uploadedImage");
    if (storedImage) {
      setPreviewURL(storedImage);
      setAnalyze(true);
    }
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const base64Img = await fileToBase64(file);
      setPreviewURL(base64Img);
      localStorage.setItem("uploadedImage", base64Img); 
      setAnalyze(true);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    setError(null);
    if (!imageFile) return;

    const formData = new FormData();
    formData.append("image_file", imageFile);

    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/stone`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const {
        skin_tone_label,
        tone_label,
        tone_undertone,
        confidence,
        face_id,
        tone_season,
        suitable_colors,
        avoid_colors,
        face_shape,
      } = res.data;

      if (face_id === 1) {
        const base64Img = await fileToBase64(imageFile);

        const result = {
          imageSrc: base64Img,
          skinTone: skin_tone_label,
          face_shape,
          toneSeason: tone_season,
          toneUndertone: tone_undertone,
          toneLabel: tone_label,
          confidence,
          suitableColors: suitable_colors,
          avoidColors: avoid_colors
        };

        localStorage.setItem("analysisResult", JSON.stringify(result));
        localStorage.setItem("analysisSaved", "false");

        toast.success("Analysis Completed!");
        navigate("/results");

        localStorage.removeItem("uploadedImage");
        setPreviewURL(null);
      }
    } catch (err) {
      const backendError =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Analysis failed. Please try again.";

      setError(backendError);
      console.error("ERROR:", backendError);
    } finally {
      setLoading(false);
      setAnalyze(false);
    }
  };

  document.body.onkeydown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      handleAnalyze()
    }
  }


  return (
    <section className="analysis-page">
      <motion.h1
        className="analysis-title"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <FaMagic className="icon-heading" /> Welcome, Style Explorer!
      </motion.h1>

      <motion.div
        className="quote"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="quote-icon">{quote.icon}</span>
        <span className="quote-text">{quote.text}</span>
      </motion.div>

      <p className="instruction">
        Upload a clear image of yourself to discover your skin tone and styling palette.
      </p>

      <motion.div
        className="upload-container"
        whileHover={{ scale: 1.02 }}
        onClick={() => fileInputRef.current.click()}
      >
        {previewURL ? (
          <img src={previewURL} alt="Preview" className="preview-image" />
        ) : (
          <div className="upload-box">
            <FaUpload size={30} />
            <p>Click or drag an image to upload</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={handleUpload}
        />
      </motion.div>

      {error ?(
        <>
          <p className="no-result-msg">{error}</p>
        </>
        
      ):(
        <></>
      )}

      <motion.button
        className="analyze-btn"
        disabled={!previewURL || !analyze || loading}
        whileHover={!previewURL || !analyze ? {} : { scale: 1.05 }}
        whileTap={!previewURL || !analyze ? {} : { scale: 0.95 }}
        onClick={handleAnalyze}
      >
        {loading ? (
          <span className="loading-icon">
            <FaSpinner className="spin" /> Analyzing...
          </span>
        ) : (
          <>Analyze</>
        )}
      </motion.button>
    </section>
  );
};

export default Analysis;
