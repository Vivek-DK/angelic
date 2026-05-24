import React, {
  useContext,
  useEffect,
  useState,
  useRef
} from "react";

import "./Dashboard.css";

import { motion } from "framer-motion";

import {
  useNavigate
} from "react-router-dom";

import Swal from "sweetalert2";

import {

  FaTrash,
  FaPalette,
  FaCalendarAlt,
  FaSpinner,
  FaSmile,
  FaSearch,
  FaExternalLinkAlt,
  FaShareAlt

} from "react-icons/fa";

import { toast } from "react-toastify";

import { UserContext }
from "../../context/UserContext";

import {
  fetchHistory,
  deleteHistory
} from "../../services/historyService";

import socket
from "../../services/socketService";


const Dashboard = () => {

  const navigate =
    useNavigate();

  const {
    user,
    loading
  } = useContext(
    UserContext
  );


  // =========================================
  // STATES
  // =========================================

  const [history, setHistory] =
    useState([]);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [search, setSearch] =
    useState("");


  // =========================================
  // REFS
  // =========================================

  const firstLoad =
    useRef(true);

  const debounceRef =
    useRef(null);


  // =========================================
  // FETCH HISTORY
  // =========================================

  const loadHistory =
    async (
      searchTerm = ""
    ) => {

      try {

        // ====================================
        // INITIAL LOADER
        // ====================================

        if (firstLoad.current) {

          setPageLoading(true);

        } else {

          setSearchLoading(true);
        }

        const response =
          await fetchHistory(
            searchTerm
          );

        setHistory(response || []);

      } catch (err) {

        console.error(err);

        toast.error(
          "Failed to fetch history."
        );

      } finally {

        setPageLoading(false);

        setSearchLoading(false);

        firstLoad.current = false;
      }
    };


  // =========================================
  // INITIAL LOAD
  // =========================================

  useEffect(() => {

    if (loading) return;

    if (!user) {

      navigate("/login");

      return;
    }

    loadHistory();

  }, [loading]);


  // =========================================
  // SEARCH
  // =========================================

  useEffect(() => {

    if (firstLoad.current)
      return;

    clearTimeout(
      debounceRef.current
    );

    debounceRef.current =
      setTimeout(() => {

        loadHistory(search);

      }, 500);

    return () =>
      clearTimeout(
        debounceRef.current
      );

  }, [search]);


  // =========================================
  // SOCKET
  // =========================================

  useEffect(() => {

    if (!user) return;

    socket.emit(
      "join",
      user.id
    );

    socket.on(

      "analysis_completed",

      () => {

        loadHistory(search);
      }
    );

    return () => {

      socket.off(
        "analysis_completed"
      );
    };

  }, [user, search]);


  // =========================================
  // DELETE
  // =========================================

  const handleDelete =
    async (id) => {

      try {

        const result =
          await Swal.fire({

            title:
              "Delete Analysis?",

            text:
              "This action cannot be undone.",

            icon: "warning",

            showCancelButton: true,

            confirmButtonText:
              "Delete",

            confirmButtonColor:
              "#ef4444",

            cancelButtonColor:
              "#2563eb",

            background:
              "#111827",

            color:
              "#ffffff"
          });

        if (!result.isConfirmed)
          return;

        setDeletingId(id);

        await deleteHistory(id);

        setHistory((prev) =>

          prev.filter(
            (item) =>
              item._id !== id
          )
        );

        toast.success(
          "Analysis deleted."
        );

      } catch (err) {

        console.error(err);

        toast.error(

          err.response?.data?.message ||

          "Delete failed."
        );

      } finally {

        setDeletingId(null);
      }
    };

  const handleShare = async (
    entry
  ) => {

    const shareUrl =

      `${window.location.origin}/report/${entry._id}`;

    try {

      await navigator.share({

        title:
          "Angelic AI Fashion Report",

        text:
          "Check out my AI fashion analysis report",

        url: shareUrl
      });

    } catch (err) {

      await navigator.clipboard.writeText(
        shareUrl
      );

      toast.success(
        "Report link copied!"
      );
    }
  };

  const handleOpenReport = (
    entry
  ) => {

    localStorage.setItem(

      "selectedReport",

      JSON.stringify(entry)
    );

    navigate(

      `/report/${entry._id}`,

      {

        state: {
          report: entry
        }
      }
    );
  };


  // =========================================
  // PAGE LOADER
  // =========================================

  if (pageLoading) {

    return (

      <div className="dashboard-loading">

        <FaSpinner className="spin big-spinner" />

        <h2>
          Loading Analysis...
        </h2>

      </div>
    );
  }


  // =========================================
  // EMPTY
  // =========================================

  if (
    !history.length
  ) {

    return (

      <div className="dashboard-container">

        <h2 className="dashboard-title">

          Your Saved Analysis

        </h2>

        <div className="dashboard-search">

          <FaSearch />

          <input

            type="text"

            placeholder=
              "Search analysis..."

            value={search}

            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />

          {searchLoading && (

            <FaSpinner className="spin" />
          )}

        </div>

        <div className="dashboard-empty">

          <h2>

            No Analysis Found

          </h2>

          <p>

            {search

              ? `No result for "${search}"`

              : "Save your first analysis."}

          </p>

        </div>

      </div>
    );
  }


  // =========================================
  // UI
  // =========================================

  return (

    <div className="dashboard-container">

      <h2 className="dashboard-title">

        Your Saved Analysis

      </h2>


      {/* SEARCH */}

      <div className="dashboard-search">

        <FaSearch />

        <input

          type="text"

          placeholder=
            "Search analysis..."

          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        {searchLoading && (

          <FaSpinner className="spin" />
        )}

      </div>


      {/* GRID */}

      <div className="dashboard-grid">

        {history.map((entry, index) => (

          <motion.div

            key={entry._id}

            className=
              "dashboard-card"

            initial={{
              opacity: 0,
              y: 20
            }}

            whileInView={{
              opacity: 1,
              y: 0
            }}

            transition={{
              duration: 0.4,
              delay: index * 0.04
            }}
          >

            {/* IMAGE */}

            <img

              src={entry.imageUrl}

              loading="lazy"

              alt="Analysis"

              className="dashboard-img"
            />


            {/* META */}

            <div className="dashboard-meta">

              <h3>

                {
                  entry.analysisName
                }

              </h3>

              <p>

                <FaCalendarAlt />

                <strong>
                  Date:
                </strong>

                {" "}

                {new Date(
                  entry.createdAt
                ).toLocaleDateString()}

              </p>

              <p>

                <FaPalette />

                <strong>
                  Skin Tone:
                </strong>

                {" "}

                {entry.skinTone}

              </p>

              <p>

                <FaSmile />

                <strong>
                  Face Shape:
                </strong>

                {" "}

                {entry.faceShape ||
                  "N/A"}

              </p>

            </div>


            {/* SUITABLE COLORS */}

            <div className=
              "dashboard-colors"
            >

              <p>

                <strong>
                  Suitable Colors
                </strong>

              </p>

              <div className=
                "color-grid"
              >

                {entry.colors?.map(

                  (color, i) => (

                    <div

                      key={i}

                      className=
                        "color-item"
                    >

                      <div

                        className=
                          "color-circle"

                        style={{
                          backgroundColor:
                            color
                        }}
                      />

                      <p className=
                        "color-name"
                      >

                        {
                          entry
                          .colorsName?.[i]
                        }

                      </p>

                    </div>
                  )
                )}

              </div>
            </div>

            {/* AVOID COLORS */}

            {entry.avoidColors?.length > 0 && (

              <div className="dashboard-colors avoid-section">

                <p>

                  <strong>
                    Avoid Colors
                  </strong>

                </p>

                <div className="color-grid">

                  {entry.avoidColors.map(

                    (color, i) => (

                      <div

                        key={i}

                        className="color-item"
                      >

                        <div

                          className="color-circle"

                          style={{
                            backgroundColor:
                              color
                          }}
                        />

                        <p className="color-name">

                          {
                            entry
                            .avoidColorsName?.[i]
                          }

                        </p>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* ACTIONS */}

            <div className="dashboard-actions">

              {/* OPEN REPORT */}

              <button

                className="dashboard-btn view-btn"

                onClick={() =>
                  handleOpenReport(
                    entry
                  )
                }
              >

                <FaExternalLinkAlt />

                View Report

              </button>

              {/* SHARE */}

              <button

                className="dashboard-btn share-btn"

                onClick={() =>
                  handleShare(
                    entry
                  )
                }
              >

                <FaShareAlt />

                Share

              </button>

              {/* DELETE */}

              <button

                className="dashboard-btn delete-btn"

                onClick={() =>
                  handleDelete(
                    entry._id
                  )
                }

                disabled={
                  deletingId === entry._id
                }
              >

                {deletingId === entry._id ? (

                  <FaSpinner className="spin" />

                ) : (

                  <FaTrash />
                )}

                Delete

              </button>

            </div>

          </motion.div>
        ))}

      </div>

    </div>
  );
};

export default Dashboard;