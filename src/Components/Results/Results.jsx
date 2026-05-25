import React, {

  useEffect,

  useState,

  useContext

} from "react";

import "./Results.css";

import {

  FaPalette,

  FaTimesCircle,

  FaCheckCircle,

  FaPercentage,

  FaCrown,

  FaShapes,

  FaSave,

  FaSpinner

} from "react-icons/fa";

import {

  toast

} from "react-toastify";

import {

  useNavigate

} from "react-router-dom";

import {

  motion

} from "framer-motion";

import {

  UserContext

} from "../../context/UserContext";

import {

  generateUploadUrl,

  uploadToS3

} from "../../services/uploadService";

import {

  saveHistory

} from "../../services/historyService";


const Result = () => {

  const navigate =
    useNavigate();

  const { user } =
    useContext(
      UserContext
    );

  const [data, setData] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [showModal,
    setShowModal] =
      useState(false);

  const [analysisName,
    setAnalysisName] =
      useState("");


  // ==========================================
  // LOAD RESULT
  // ==========================================

  useEffect(() => {

    const stored =
      localStorage.getItem(
        "analysisResult"
      );

    if (!stored) {

      toast.error(
        "No analysis found."
      );

      navigate("/analysis");

      return;
    }

    try {

      setData(
        JSON.parse(stored)
      );

    } catch (err) {

      console.error(err);

      toast.error(
        "Invalid analysis data."
      );

      navigate("/analysis");
    }

  }, []);


  // ==========================================
  // SAVE CLICK
  // ==========================================

  const handleSaveClick =
    () => {

      if (!user) {

        toast.error(
          "Please login to save."
        );

        navigate("/login");

        return;
      }

      setShowModal(true);
    };


  // ==========================================
  // SAVE ANALYSIS
  // ==========================================

  const handleSaveAnalysis =
  async () => {

    if (!analysisName.trim()) {

      toast.error(
        "Please enter analysis name."
      );

      return;
    }

    try {

      setSaving(true);

      const token =
        localStorage.getItem(
          "token"
        );


      // ======================================
      // BASE64 → FILE
      // ======================================

      const response =
        await fetch(
          data.imageSrc
        );

      const blob =
        await response.blob();

      const file =
        new File(

          [blob],

          "analysis.jpg",

          {
            type:
              blob.type
          }
        );


      // ======================================
      // GENERATE S3 URL
      // ======================================

      const uploadData =
        await generateUploadUrl(

          file.type,

          token
        );

      const {

        uploadUrl,

        imageKey

      } = uploadData;

      // ======================================
      // UPLOAD TO S3
      // ======================================

      await uploadToS3(

        uploadUrl,

        file
      );


      // ======================================
      // SAVE HISTORY
      // ======================================

      await saveHistory({

        analysisName,

        imageKey,

        skinTone:
          data.skinTone,

        faceShape:
          data.faceShape,

        colors:
          data.suitableColors.map(
            (c) => c.hex
          ),

        colorsName:
          data.suitableColors.map(
            (c) => c.name
          ),

        avoidColors:
          data.avoidColors.map(
            (c) => c.hex
          ),

        avoidColorsName:
          data.avoidColors.map(
            (c) => c.name
          )
      });


      // ======================================
      // SUCCESS
      // ======================================

      toast.success(
        "Analysis saved successfully!"
      );

      setSaved(true);

      setShowModal(false);

      setAnalysisName("");

    } catch (err) {

      console.error(err);

      toast.error(

        err.response?.data?.message ||

        "Failed to save analysis."
      );
      
      setSaved(false);

    } finally {

      setSaving(false);
    }
  };

  if (!data) return null;


  return (

    <section className="result-container">


      {/* TOP */}

      <div className="result-top">


        {/* IMAGE */}

        <div className="image-section">

          <img

            src={data.imageSrc}

            alt="Uploaded Face"
          />

        </div>


        {/* DETAILS */}

        <div className="result-details">


          <div className="result-card">

            <h4>

              <FaPalette className="icon" />

              Skin Tone

            </h4>

            <p>

              {data.skinTone},

              {" "}

              {data.toneUndertone}

            </p>

          </div>


          <div className="result-card">

            <h4>

              <FaShapes className="icon" />

              Face Shape

            </h4>

            <p>

              {data.faceShape}

            </p>

          </div>


          {data.primaryFaceShape && (

            <div className="result-card">

              <h4>

                <FaCrown className="icon" />

                Primary Match

              </h4>

              <p>

                {
                  data.primaryFaceShape
                }

              </p>

            </div>
          )}


          <div className="result-card">

            <h4>

              <FaPercentage className="icon" />

              Skin Tone Accuracy

            </h4>

            <div className="confidence-bar">

              <div

                className="fill"

                style={{
                  width:
                    `${data.confidence}%`
                }}
              />

            </div>

            <span>

              {data.confidence}%

            </span>

          </div>


          {data.faceShapeConfidence && (

            <div className="result-card">

              <h4>

                <FaPercentage className="icon" />

                Face Shape Accuracy

              </h4>

              <div className="confidence-bar">

                <div

                  className="fill"

                  style={{
                    width:

                      `${

                        data.faceShapeConfidence * 100

                      }%`
                  }}
                />

              </div>

              <span>

                {

                  Math.round(

                    data.faceShapeConfidence * 100
                  )

                }%

              </span>

            </div>
          )}

        </div>

      </div>


      {/* COLORS */}

      <div className="palette-section">


        <h4>

          <span className="right">

            <FaCheckCircle className="icon" />

          </span>

          {" "}

          Colors That Suit You

        </h4>


        <div className="swatches">

          {data.suitableColors.map(

            (color, i) => (

              <div

                key={i}

                className="swatch"

                style={{
                  backgroundColor:
                    color.hex
                }}
              >

                <span>

                  {color.name}

                </span>

              </div>
            )
          )}

        </div>


        <h4 className="avoid-title">

          <span className="wrong">

            <FaTimesCircle className="icon" />

          </span>

          {" "}

          Colors to Avoid

        </h4>


        <div className="swatches avoid">

          {data.avoidColors.map(

            (color, i) => (

              <div

                key={i}

                className="swatch"

                style={{
                  backgroundColor:
                    color.hex
                }}
              >

                <span>

                  {color.name}

                </span>

              </div>
            )
          )}

        </div>


        {/* SAVE BUTTON */}

        <button

          className="save-btn"

          onClick={handleSaveClick}

          disabled={saved || saving}
        >

          {saving ? (

            <>

              <FaSpinner className="spin" />

              Saving...

            </>

          ) : saved ? (

            <>

              <FaCheckCircle />

              Saved

            </>

          ) : (

            <>

              <FaSave />

              Save Analysis

            </>
          )}

        </button>

      </div>


      {/* SAVE MODAL */}

      {showModal && (

        <div className="save-modal-overlay">

          <motion.div

            className="save-modal"

            initial={{
              opacity: 0,
              scale: 0.8
            }}

            animate={{
              opacity: 1,
              scale: 1
            }}
          >

            <h2>

              Save Analysis

            </h2>

            <p>

              Enter a name for
              this analysis.

            </p>

            <input

              type="text"

              placeholder=
                "Example: Vivek"

              value={analysisName}

              onChange={(e) =>
                setAnalysisName(
                  e.target.value
                )
              }

              className="save-analysis-input"
            />

            <div className="save-modal-actions">

              <button

                className="cancel-btn"

                onClick={() =>
                  setShowModal(false)
                }
              >

                Cancel

              </button>


              <button

                className="save-btn"

                onClick={
                  handleSaveAnalysis
                }

                disabled={saving}
              >

                {saving ? (

                  <>

                    <FaSpinner className="spin" />

                    Saving...

                  </>

                ) : (

                  "Save"
                )}

              </button>

            </div>

          </motion.div>

        </div>
      )}

    </section>
  );
};

export default Result;