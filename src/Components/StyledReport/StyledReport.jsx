import React, {

  useEffect,

  useState

} from "react";

import {

  useNavigate,

  useParams

} from "react-router-dom";

import html2pdf from "html2pdf.js";

import {

  FaDownload,

  FaArrowLeft,

  FaCopyright,

  FaSpinner,

  FaPalette,

  FaSmile,

  FaCalendarAlt

} from "react-icons/fa";

import {

  toast

} from "react-toastify";

import "./StyledReport.css";

import angel from "../../assets/angel.png";

import {

  fetchReport

} from "../../services/historyService";


const StyledReport = () => {

  const { id } =
    useParams();

  const navigate =
    useNavigate();

  const [analysis,
    setAnalysis] =
      useState(null);

  const [loading,
    setLoading] =
      useState(true);

  const [downloading,
    setDownloading] =
      useState(false);


  // ==========================================
  // FETCH REPORT
  // ==========================================

  useEffect(() => {

    const loadReport =
      async () => {

        try {

          const response =
            await fetchReport(id);

          const reportData =

            response.data ||

            response;

          setAnalysis(reportData);

        } catch (err) {

          console.error(err);

          toast.error(
            "Failed to load report."
          );

          navigate("/dashboard");

        } finally {

          setLoading(false);
        }
      };

    loadReport();

  }, [id, navigate]);


  // ==========================================
  // PDF DOWNLOAD
  // ==========================================

  const downloadAsPDF =
    async () => {

      try {

        setDownloading(true);

        const element =
          document.getElementById(
            "report-card"
          );

        const options = {

          margin: 0.2,

          filename:

            `${analysis.analysisName ||
              "Analysis"}_Report.pdf`,

          image: {

            type: "jpeg",

            quality: 1
          },

          html2canvas: {

            scale: 2,

            useCORS: true,

            allowTaint: false
          },

          jsPDF: {

            unit: "in",

            format: "letter",

            orientation: "portrait"
          }
        };

        await html2pdf()

          .from(element)

          .set(options)

          .save();

      } catch (err) {

        console.error(err);

        toast.error(
          "PDF generation failed."
        );

      } finally {

        setDownloading(false);
      }
    };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="report-loading">

        <FaSpinner className="spin" />

        Loading report...

      </div>
    );
  }


  // ==========================================
  // EMPTY
  // ==========================================

  if (!analysis) {

    return (

      <div className="report-loading">

        Report not found.

      </div>
    );
  }


  return (

    <div className="report-page">


      {/* BACK */}

      <button

        className="back-btn"

        onClick={() =>
          navigate("/dashboard")
        }
      >

        <FaArrowLeft />

        Back

      </button>


      {/* REPORT */}

      <div

        id="report-card"

        className="report-container"
      >


        {/* HEADER */}

        <div className="report-header">

          <img

            src={angel}

            alt="logo"

            className="brand-logo"
          />

          <h1 className="report-title">

            Personal Color Analysis Report

          </h1>

        </div>


        {/* ANALYSIS NAME */}

        <div className="analysis-name">

          {analysis.analysisName}

        </div>


        {/* IMAGE */}

        <div className="report-image-section">

          <img

            src={analysis.imageUrl}

            alt="user"

            className="user-photo"

            crossOrigin="anonymous"
          />

        </div>


        {/* DETAILS */}

        <div className="details-grid">


          <div className="detail-card">

            <FaPalette />

            <h3>
              Skin Tone
            </h3>

            <p>
              {analysis.skinTone}
            </p>

          </div>


          <div className="detail-card">

            <FaSmile />

            <h3>
              Face Shape
            </h3>

            <p>
              {analysis.faceShape ||
                "N/A"}
            </p>

          </div>


          <div className="detail-card">

            <FaCalendarAlt />

            <h3>
              Date
            </h3>

            <p>

              {new Date(
                analysis.createdAt
              ).toLocaleDateString()}

            </p>

          </div>

        </div>


        {/* RECOMMENDED COLORS */}

        <div className="report-section">

          <h2>
            Recommended Colors
          </h2>

          <div className="swatch-grid">

            {analysis.colors?.map(

              (color, idx) => (

                <div

                  key={idx}

                  className="color-card"
                >

                  <div

                    className=
                      "color-swatch"

                    style={{
                      backgroundColor:
                        color
                    }}
                  />

                  <p className=
                    "color-name"
                  >

                    {
                      analysis
                      .colorsName?.[idx]
                    }

                  </p>

                </div>
              )
            )}

          </div>

        </div>


        {/* AVOID COLORS */}

        {analysis.avoidColors?.length >
          0 && (

          <div className="report-section">

            <h2>
              Colors to Avoid
            </h2>

            <div className="swatch-grid">

              {analysis.avoidColors.map(

                (color, idx) => (

                  <div

                    key={idx}

                    className="color-card"
                  >

                    <div

                      className=
                        "color-swatch"

                      style={{
                        backgroundColor:
                          color
                      }}
                    />

                    <p className=
                      "color-name"
                    >

                      {color}

                    </p>

                  </div>
                )
              )}

            </div>

          </div>
        )}


        {/* FOOTER */}

        <div className="report-footer">

          <p>

            <FaCopyright />

            {" "}

            2026 Angelic Fashion AI

          </p>

        </div>

      </div>


      {/* DOWNLOAD */}

      <button

        className="download-btn"

        onClick={downloadAsPDF}

        disabled={downloading}
      >

        {downloading ? (

          <>

            <FaSpinner className="spin" />

            Generating PDF...

          </>

        ) : (

          <>

            <FaDownload />

            Download PDF

          </>
        )}

      </button>

    </div>
  );
};

export default StyledReport;