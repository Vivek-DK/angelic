import React, { useContext, useEffect, useState } from "react";
import "./Results.css";
import { saveHistory } from "../../utils/api";
import {
  FaUser,
  FaPalette,
  FaTimesCircle,
  FaCheckCircle,
  FaPercentage,
  FaSpinner
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/UserContext";
import { toast } from "react-toastify";
import OutfitSection from "../OutfitSection/OutfitSection";

const Result = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("analysisResult");
    const analysisSaved  = localStorage.getItem("analysisSaved")
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      toast.error("No analysis data found. Please analyze again.");
      navigate("/analysis");
    }

    if(analysisSaved === "true"){
      setSaved(true)
    }
  }, []);


  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save your analysis");
      navigate("/login");
      return;
    }

    try {
      setSaving(true)
      await saveHistory(data.imageSrc, {
        skinTone: `${data.skinTone}, ${data.toneUndertone}`,
        faceShape: data.face_shape,
        colors: data.suitableColors.map((c) => c.hex),
        colorsName: data.suitableColors.map((c) => c.name),
      });
      setSaved(true)
      localStorage.setItem('analysisSaved', "true")
      toast.success("Analysis saved successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to save analysis.");
    } finally{
      setSaving(false) 
    }
  };

  if (!data) return null;

  return (
    <section className="result-container">
      <div className="result-top">
        <div className="image-section">
          <img src={data.imageSrc} alt="Uploaded Face" />
        </div>

        <div className="result-details">
          <div className="result-card">
            <h4>
              <FaPalette className="icon" />Skin Tone
            </h4>
            <p>
              {data.skinTone}, {data.toneUndertone}
            </p>
          </div>

          <div className="result-card">
            <h4>
              <FaUser className="icon" />Face Shape
            </h4>
            <p>{data.face_shape}</p>
          </div>

          <div className="result-card">
            <h4>
              <FaPercentage className="icon" />Confidence
            </h4>
            <div className="confidence-bar">
              <div className="fill" style={{ width: `${data.confidence}%` }} />
            </div>
            <span>{data.confidence}%</span>
          </div>
        </div>
      </div>

      <div className="palette-section">
        <h4>
          <span className="right">
            <FaCheckCircle className="icon" />
          </span>{" "}
          Colors That Suit You 
        </h4>
        <div className="swatches">
          {data.suitableColors.map((color, i) => (
            <div key={i} className="swatch" style={{ backgroundColor: color.hex }}>
              <span>{color.name}</span>
            </div>
          ))}
        </div>

        <h4 className="avoid-title">
          <span className="wrong">
            <FaTimesCircle className="icon" />
          </span>{" "}
          Colors to Avoid
        </h4>
        <div className="swatches avoid">
          {data.avoidColors.map((color, i) => (
            <div key={i} className="swatch" style={{ backgroundColor: color.hex }}>
              <span>{color.name}</span>
            </div>
          ))}
        </div>
        <button className="save-btn" onClick={handleSave} disabled={saving || saved}>
          {saving ? (
          <span className="loading-icon">
            <FaSpinner className="spin" /> Saving Your Analysis...
          </span>
          ) : saved ? (
          <span className="loading-icon">
            <FaCheckCircle/> Analysis Saved!
          </span>
          ) : (
          "Save Analysis"
          )}
        </button>
      </div>
      <OutfitSection />
    </section>
  );
};

export default Result;
