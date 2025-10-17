import React, { useEffect, useState, useCallback } from "react";
import OutfitCard from "../OutfitCard/OutfitCard";
import "./outfitSection.css";
import { motion } from "framer-motion";
import axios from "axios";

const OutfitSection = () => {
  const [gender, setGender] = useState("male");
  const [category, setCategory] = useState("trending");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const API_BASE = 'http://localhost:5000';

  const fetchData = useCallback(
    debounce(async (gender, category, page) => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE}/api/search?gender=${gender}&category=${category}&page=${page}`
        );
        setProducts(res.data.products || []);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    fetchData(gender, category, page);
  }, [gender, category, page, fetchData]);

  const categories = [
    "Trending", 
    "Casuals", 
    "Party", 
    "Formal",
    "Accessories"
  ];

  return (
    <div className="outfit">
      <h1 className="out-title">Recomendations</h1>

      <p className="head">Gender</p>
      <motion.div
        className="gender-selector"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <button className={gender === "male" ? "active" : ""} onClick={() => { setPage(1); setGender("male"); }}>Male</button>
        <button className={gender === "female" ? "active" : ""} onClick={() => { setPage(1); setGender("female"); }}>Female</button>
      </motion.div>

      <p className="head">Categories</p>
      <motion.div
        className="category-selector"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            className={category === cat ? "active" : ""}
            onClick={() => { setPage(1); setCategory(cat); }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="modern-spinner"></div>
      ) : (
        <motion.div
          className="outfit-section-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {products.map((item, idx) => (
            <OutfitCard key={idx} item={item} />
          ))}
        </motion.div>
      )}

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export default OutfitSection;
