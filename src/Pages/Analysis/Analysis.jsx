import React, {
  useEffect,
  useRef,
  useState
} from "react";

import "./Analysis.css";

import { 
  motion 
} from "framer-motion";

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

import { 
  toast 
} from "react-toastify";

import { 
  useNavigate
} from "react-router-dom";

import Swal from "sweetalert2";

import fileToBase64 from "../../utils/fileToBase64";

import optimizeImage from "../../utils/optimizeImage";

import { 
  analyzeImage 
} from "../../services/analysisService";

const quotes = [

  {
    icon: <FaMagic />,
    text:
      "Style is a way to say who you are without speaking."
  },

  {
    icon: <FaPalette />,
    text:
      "Fashion is art and you are the canvas."
  },

  {
    icon: <FaSmile />,
    text:
      "Beauty begins the moment you decide to be yourself."
  },

  {
    icon: <FaCameraRetro />,
    text:
      "One photo, endless styling possibilities."
  },

  {
    icon: <FaTshirt />,
    text:
      "Let's find your perfect shades!"
  },

  {
    icon: <FaGem />,
    text:
      "Elegance is not about being noticed, it's about being remembered."
  },

  {
    icon: <FaStar />,
    text:
      "Your vibe attracts your style."
  },

  {
    icon: <FaFeather />,
    text:
      "Wear confidence like it's your favorite outfit."
  },

  {
    icon: <FaSun />,
    text:
      "Colors are the smiles of nature."
  },

  {
    icon: <FaCrown />,
    text:
      "Own your look, rule your world."
  },

  {
    icon: <FaLeaf />,
    text:
      "Simplicity is the keynote of true elegance."
  },

  {
    icon: <FaHeart />,
    text:
      "Love the skin you're in and the style you wear."
  }
];


const Analysis = () => {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const [quote] = useState(
    quotes[
      Math.floor(
        Math.random() * quotes.length
      )
    ]
  );

  const [imageFile, setImageFile] =
    useState(null);

  const [previewURL, setPreviewURL] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [progress, setProgress] =
  useState(0);

  const [progressText,
    setProgressText] =
      useState("");

  const [canAnalyze, setCanAnalyze] =
    useState(false);

  const [error, setError] =
    useState(null);

  // =====================================================
  // SERVER WAKEUP POPUP
  // =====================================================

  useEffect(() => {

    const alreadyShown =
      sessionStorage.getItem(
        "server_wakeup_popup_shown"
      );

    if (!alreadyShown) {

      Swal.fire({

        title: "Warming Up…",

        text:
          "This project runs on free Render hosting. First request may take up to 1 minute.",

        icon: "info",

        confirmButtonText: "Got it"
      });

      sessionStorage.setItem(
        "server_wakeup_popup_shown",
        "true"
      );
    }

  }, []);


  // =====================================================
  // KEYBOARD ANALYZE
  // =====================================================

  useEffect(() => {

    const handleKeyDown = (e) => {

      if (

        e.key === "Enter" &&

        e.target.tagName !== "INPUT" &&

        e.target.tagName !== "TEXTAREA"

      ) {

        handleAnalyze();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, [imageFile]);

  // =====================================================
  // HANDLE IMAGE UPLOAD
  // =====================================================

  const handleUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    if (

      !file.type.startsWith("image/")

    ) {

      toast.error(
        "Please upload an image file."
      );

      return;
    }

    try {

      setError(null);

      setImageFile(file);

      const base64Img =
        await fileToBase64(file);

      setPreviewURL(base64Img);

      setCanAnalyze(true);

    } catch (err) {

      console.error(err);

      toast.error(
        "Failed to preview image."
      );
    }
  };


  // =====================================================
  // HANDLE ANALYSIS
  // =====================================================

  const handleAnalyze = async () => {

    if (!imageFile) {

      toast.error(
        "Please upload an image."
      );

      return;
    }

    let progressInterval;

    try {

      setLoading(true);

      setError(null);

      setProgress(5);

      setProgressText(
        "Uploading image..."
      );


      // ======================================
      // FAKE SMOOTH PROGRESS
      // ======================================

      progressInterval =
        setInterval(() => {

          setProgress((prev) => {

            if (prev >= 90)
              return prev;

            return prev + 5;
          });

        }, 500);


      // ======================================
      // ANALYZE IMAGE
      // ======================================

      setProgressText(
        "Optimizing image..."
      );

      // IMAGE COMPRASSING 

      const optimizedImage =

        await optimizeImage(
          imageFile
        );

      const analysisData =
        await analyzeImage(
          optimizedImage
        );

      console.log(

        "Original:",

        (imageFile.size / 1024 / 1024)
          .toFixed(2),

        "MB"
      );

      console.log(

        "Optimized:",

        (optimizedImage.size / 1024 / 1024)
          .toFixed(2),

        "MB"
      );

      // ======================================
      // UPDATE TEXT
      // ======================================

      setProgressText(
        "Generating recommendations..."
      );


      // ======================================
      // EXTRACT RESPONSE
      // ======================================

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

        primary_face_shape,

        secondary_face_shape,

        face_shape_confidence

      } = analysisData;


      // ======================================
      // FACE CHECK
      // ======================================

      if (face_id !== 1) {

        throw new Error(
          "Face detection failed."
        );
      }


      // ======================================
      // CONVERT IMAGE
      // ======================================

      console.log(
        optimizedImage
      );

      const base64Img =
        await fileToBase64(
          optimizedImage
        );


      // ======================================
      // RESULT OBJECT
      // ======================================

      const result = {

        imageSrc:
          base64Img,

        skinTone:
          skin_tone_label,

        faceShape:
          face_shape,

        primaryFaceShape:
          primary_face_shape,

        secondaryFaceShape:
          secondary_face_shape,

        faceShapeConfidence:
          face_shape_confidence,

        toneSeason:
          tone_season,

        toneUndertone:
          tone_undertone,

        toneLabel:
          tone_label,

        confidence,

        suitableColors:
          suitable_colors,

        avoidColors:
          avoid_colors
      };


      // ======================================
      // STORE RESULT
      // ======================================

      localStorage.setItem(

        "analysisResult",

        JSON.stringify(result)
      );

      // ======================================
      // COMPLETE PROGRESS
      // ======================================

      clearInterval(
        progressInterval
      );

      setProgress(100);

      setProgressText(
        "Analysis completed"
      );


      // ======================================
      // SMALL DELAY FOR UX
      // ======================================

      await new Promise(

        (resolve) =>

          setTimeout(
            resolve,
            1200
          )
      );


      toast.success(
        "Analysis completed!"
      );


      navigate("/results");


    } catch (err) {

      console.error(err);

      clearInterval(
        progressInterval
      );

      const backendError =

        err.response?.data?.detail ||

        err.response?.data?.message ||

        err.message ||

        "Analysis failed.";

      setError(
        backendError
      );

      toast.error(
        backendError
      );

    } finally {

      clearInterval(
        progressInterval
      );

      setLoading(false);

      setCanAnalyze(false);
    }
  };

  return (

    <section className="analysis-page">

      <motion.h1

        className="analysis-title"

        initial={{
          y: 20,
          opacity: 0
        }}

        animate={{
          y: 0,
          opacity: 1
        }}
      >

        <FaMagic
          className="icon-heading"
        />

        Welcome, Style Explorer!

      </motion.h1>


      {/* QUOTE */}

      <motion.div

        className="quote"

        initial={{
          opacity: 0
        }}

        animate={{
          opacity: 1
        }}

        transition={{
          delay: 0.2
        }}
      >

        <span className="quote-icon">
          {quote.icon}
        </span>

        <span className="quote-text">
          {quote.text}
        </span>

      </motion.div>


      {/* INSTRUCTION */}

      <p className="instruction">

        Upload a clear image to
        discover your skin tone,
        face shape, and styling palette.

      </p>

      {/* IMAGE UPLOAD */}

      <motion.div

        className="upload-container"

        whileHover={{
          scale: 1.02
        }}

        onClick={() =>
          fileInputRef.current.click()
        }
      >

        {previewURL ? (

          <img

            src={previewURL}

            alt="Preview"

            className="preview-image"
          />

        ) : (

          <div className="upload-box">

            <FaUpload size={30} />

            <p>
              Click or drag image
              to upload
            </p>

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


      {/* ERROR */}

      {error && (

        <p className="no-result-msg">
          {error}
        </p>
      )}

      {/* PROGRESS */}

      {loading && (

        <div className="analysis-progress">

          <div className="progress-bar">

            <div

              className="progress-fill"

              style={{
                width: `${progress}%`
              }}
            />

          </div>

          <p className="progress-text">

            {progressText}

          </p>

        </div>
      )}

      {/* ANALYZE BUTTON */}

      <motion.button

        className="analyze-btn"

        disabled={
          !previewURL ||
          !canAnalyze ||
          loading
        }

        whileHover={
          !previewURL ||
          !canAnalyze

            ? {}

            : {
                scale: 1.05
              }
        }

        whileTap={
          !previewURL ||
          !canAnalyze

            ? {}

            : {
                scale: 0.95
              }
        }

        onClick={handleAnalyze}
      >

        {loading ? (

          <span className="loading-icon">

            <FaSpinner className="spin" />

            Analyzing...

          </span>

        ) : (

          <>Analyze</>
        )}

      </motion.button>

    </section>
  );
};

export default Analysis;