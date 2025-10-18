import React, { useEffect, useState, useContext } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserContext } from "../../context/UserContext";
import { fetchUserHistory } from "../../utils/api.js";
import { authHeader } from "../../utils/api";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaTrash,
  FaDownload,
  FaPalette,
  FaCalendarAlt,
  FaSpinner,
  FaSmile,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Dashboard = () => {
  const { user, loading } = useContext(UserContext);
  const [history, setHistory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();


  const fetchHistory = async () => {
    try {
      if (!user) {
        toast.error("You must be logged in.");
        return navigate("/login");
      }

      const results = await fetchUserHistory();
      setHistory(results);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Permission denied or network error.");
      navigate("/login");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchHistory();
    }
  }, [loading]);


  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Delete Analysis?",
        text: "Are you sure you want to delete this analysis?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, delete it",
        background: "#fff",
        customClass: {
          popup: "blur-popup"
        }
      });

      if (!result.isConfirmed) return;
      setDeletingId(id);

      const res = await axios.delete(
        `${import.meta.env.VITE_NODE_URL || 'http://localhost:5000'}/api/history/delete/${id}`,
        { headers: authHeader() }
      );

      setHistory((prev) => prev.filter((entry) => entry._id !== id));
      toast.success("Entry deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err?.response?.data?.message || "Failed to delete entry.");
    }finally {
      setDeletingId(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="spinner" /> Loading your dashboard...
      </div>
    );
  }

  if (history.length === 0) {
    return <p className="dashboard-empty">No analysis history saved yet.</p>;
  }

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Your Saved Analysis</h2>
      <div className="dashboard-grid">
        {history.map((entry, index) => (
          <motion.div
            key={entry._id}
            id={`card-${index}`}
            className="dashboard-card pdf-style"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <img
              src={entry.imageUrl}
              alt="Uploaded"
              className="dashboard-img"
              style={{ width: "300px", height: "300px", objectFit: "cover" }}
            />

            <div className="dashboard-meta">
              <p>
                <FaCalendarAlt /> <strong>Date:</strong>{" "}
                {new Date(entry.date).toLocaleDateString()}
              </p>
              <p>
                <FaPalette /> <strong>Skin Tone:</strong> {entry.skinTone}
              </p>
              <p>
                <FaSmile /> <strong>Face Shape:</strong>{" "}
                {entry.faceShape || "N/A"}
              </p>
            </div>

            <div className="dashboard-colors">
              <p>
                <strong>Suitable Colors</strong>
              </p>
              <div className="color-grid">
                {entry.colors.map((color, i) => (
                  <div
                    key={i}
                    className="color-item"
                    data-name={entry.colorsName[i]}
                  >
                    <div
                      className="color-circle"
                      style={{ backgroundColor: color }}
                    />
                    <p className="color-name">{entry.colorsName[i]}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-actions">
              <button
                onClick={() => navigate(`/report/${entry._id}`)}
              >
                <FaDownload /> PDF
              </button>
              <button
                className="delete-btn"
                onClick={() => handleDelete(entry._id)}
                disabled={deletingId === entry._id} 
              >
                {deletingId === entry._id ? (
                  <FaSpinner className="spin" />
                ) : (
                  <FaTrash />
                )}{" "}
                {deletingId === entry._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
