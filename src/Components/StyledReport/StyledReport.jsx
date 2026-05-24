import React from "react";

import {

  FaPalette,
  FaRegSmile,
  FaCalendarAlt,
  FaShareAlt,
  FaDownload

} from "react-icons/fa";

import {

  formatDate

} from "../../utils/reportHelpers";

import {

  shareReport

} from "../../utils/shareReport";

import "./StyledReport.css";

const StyledReport = ({

  report,
  reportRef

}) => {

  const suitableColors =

    report.suitableColors ||

    report.colors ||

    [];

  const suitableColorNames =

    report.suitableColorsName ||

    report.colorsName ||

    [];

  const avoidColors =

    report.avoidColors ||

    [];

  const avoidColorNames =

    report.avoidColorsName ||

    [];

  // ======================================
  // SHARE REPORT
  // ======================================

  const handleShare =
    async () => {

      const url =
        window.location.href;

      try {

        await navigator.share({

          title:
            "Angelic AI Report",

          text:
            "Check out my AI fashion report",

          url
        });

      } catch {

        navigator.clipboard.writeText(
          url
        );

        alert(
          "Link copied!"
        );
      }
    };

  return (

    <div className="angelic-report-wrapper">

      {/* ====================================== */}
      {/* REPORT */}
      {/* ====================================== */}

      <div
        className="angelic-report-container"
        ref={reportRef}
      >

        {/* ====================================== */}
        {/* HEADER */}
        {/* ====================================== */}

        <div className="angelic-report-header">

          <div className="angelic-text-logo">

            ANGELIC AI

          </div>

          <h1 className="angelic-report-title">

            Personalized Fashion Report

          </h1>

          <p className="angelic-report-subtitle">

            AI Powered Fashion Analysis

          </p>

        </div>

        {/* ====================================== */}
        {/* USER IMAGE */}
        {/* ====================================== */}

        <div className="angelic-image-wrapper">

          <div className="angelic-image-glow" />

          <img

            src={
              report.imageUrl
            }

            alt="user"

            className="angelic-user-photo"

          />

        </div>

        {/* ====================================== */}
        {/* ANALYSIS NAME */}
        {/* ====================================== */}

        <h2 className="angelic-analysis-name">

          {
            report.analysisName
          }

        </h2>

        {/* ====================================== */}
        {/* DETAILS */}
        {/* ====================================== */}

        <div className="angelic-details-grid">

          <div className="angelic-detail-card">

            <FaPalette />

            <h3>

              Skin Tone

            </h3>

            <p>

              {
                report.skinTone
              }

            </p>

          </div>

          <div className="angelic-detail-card">

            <FaRegSmile />

            <h3>

              Face Shape

            </h3>

            <p>

              {

                report.faceShape ||

                report.primaryFaceShape
              }

            </p>

          </div>

          <div className="angelic-detail-card">

            <FaCalendarAlt />

            <h3>

              Date

            </h3>

            <p>

              {
                formatDate(
                  report.createdAt
                )
              }

            </p>

          </div>

        </div>

        {/* ====================================== */}
        {/* SUITABLE COLORS */}
        {/* ====================================== */}

        <div className="angelic-report-section">

          <h2>

            Suitable Colors

          </h2>

          <div className="angelic-colors-grid">

            {suitableColors.map(

              (
                color,
                index
              ) => (

                <div
                  key={index}
                  className="angelic-color-card"
                >

                  <div

                    className="angelic-color-circle"

                    style={{
                      background:
                        color
                    }}
                  />

                  <span>

                    {

                      suitableColorNames[index] ||

                      color
                    }

                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* ====================================== */}
        {/* AVOID COLORS */}
        {/* ====================================== */}

        <div className="angelic-report-section">

          <h2>

            Avoid Colors

          </h2>

          <div className="angelic-colors-grid">

            {avoidColors.map(

              (
                color,
                index
              ) => (

                <div
                  key={index}
                  className="angelic-color-card"
                >

                  <div

                    className="angelic-color-circle"

                    style={{
                      background:
                        color
                    }}
                  />

                  <span>

                    {

                      avoidColorNames[index] ||

                      color
                    }

                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* ====================================== */}
        {/* QUOTE */}
        {/* ====================================== */}

        <div className="angelic-fashion-quote">

          “Style is confidence made visible.”

        </div>

      </div>

      {/* ====================================== */}
      {/* ACTION BUTTONS */}
      {/* ====================================== */}

      <div className="angelic-report-actions">

        <button

          className="
            angelic-report-btn
            angelic-share-btn
          "

          onClick={() =>

            shareReport(
              report._id
            )
          }
        >

          <FaShareAlt />

          Share Report

        </button>
      </div>

    </div>
  );
};

export default StyledReport;