import React, {

  useEffect,
  useRef,
  useState

} from "react";

import {

  useParams,
  useLocation,
  useNavigate

} from "react-router-dom";

import StyledReport
from "../../Components/StyledReport/StyledReport";

import {

  fetchSingleHistory

} from "../../services/historyService";

import "./ReportPage.css";

const ReportPage = () => {

  const { id } =
    useParams();

  const location =
    useLocation();

  const navigate =
    useNavigate();

  const reportRef =
    useRef(null);

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // ======================================
  // LOAD REPORT
  // ======================================

  useEffect(() => {

    const loadReport =
      async () => {

        try {

          // ==============================
          // API FALLBACK
          // ==============================

          const reportData =
            await fetchSingleHistory(id);

          setReport(reportData);

        } catch (err) {

          console.error(err);

        } finally {

          setLoading(false);
        }
      };

    loadReport();

  }, [id]);

  // ======================================
  // LOADING
  // ======================================

  if (loading) {

    return (

      <div className="report-loading">

        Loading Report...

      </div>
    );
  }

  if (!report) {

    return (

      <div className="report-loading">

        Report not found

      </div>
    );
  }

  return (

    <div className="report-page">

      <StyledReport

        report={report}

        reportRef={reportRef}
      />

    </div>
  );
};

export default ReportPage;