import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { FaDownload, FaArrowLeft, FaCopyright } from "react-icons/fa";
import axios from "axios";
import { authHeader } from "../../utils/api.js";
import "./StyledReport.css";
import angle from '../../assets/angel.png'

const StyledReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_URL || "http://localhost:5000"}/api/history/${id}`,
          { headers: authHeader() }
        );
        setAnalysis(res.data);
      } catch (err) {
        console.error("Error fetching analysis:", err);
        navigate("/dashboard");
      }
    };
    fetchAnalysis();
  }, [id, navigate]);

  const downloadAsPDF = () => {
    const element = document.getElementById("report-card");
    const opt = {
      margin: 0.2,
      filename: `Analysis_${analysis?.skinTone || "Report"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS:true,
        allowTaint:false,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };
    html2pdf().from(element).set(opt).save();
  };

  if (!analysis) {
    return <p style={{ textAlign: "center" }}>Loading report...</p>;
  }

  return (
    <div className="report-page">
      <button className="back-btn" onClick={() => navigate("/dashboard")}>
        <FaArrowLeft /> Back
      </button>

      <div id="report-card" className="report-container">
        <div className="report-header">
          <img src={angle} alt="Brand Logo" className="brand-logo" />
          <h1 className="report-title">Personal Color Analysis Report</h1>
        </div>

        <div className="report-image-section">
          <img src={analysis.imageUrl} alt="User" className="user-photo" crossOrigin="anonymous"/>
        </div>

        <div className="section">
          <h2>Skin Tone: </h2>
          <p className="skin-tone-name">{analysis.skinTone}</p>
        </div>

        <div className="section">
          <h2>Face Shape: </h2>
          <p className="skin-tone-name">{analysis.faceShape}</p>
        </div> 

        <div className="section">
          <h2>Date: </h2>
          <p className="skin-tone-name">{new Date(analysis.date).toLocaleDateString()}</p>
        </div>  

        <div className="report-section">
          <h2>Recommended Colors</h2>
          <div className="swatch-grid">
            {analysis.colors.map((color, idx) => (
              <div key={idx} className="color-card">
                <div
                  className="color-swatch"
                  style={{ backgroundColor: color }}
                ></div>
              <p className="color-name">{analysis.colorsName[idx]}</p>
              </div>
            ))}
          </div>
        </div>

        {analysis.avoidColors && analysis.avoidColors.length > 0 && (
          <div className="report-section">
            <h2>Colors to Avoid</h2>
            <div className="swatch-grid">
              {analysis.avoidColors.map((color, idx) => (
                <div key={idx} className="color-card">
                  <div
                    className="color-swatch"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span>{color}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="report-footer">
          <p><FaCopyright /> 2025 Angelic Fashion AI - All Rights Reserved</p>
        </div>
      </div>

      <button className="download-btn" onClick={downloadAsPDF}>
        <FaDownload /> Download PDF
      </button>
    </div>
  );
};

export default StyledReport;
