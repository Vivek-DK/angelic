import React, { useState } from "react";
import "./VirtualTryOn.css";

const BACKEND_URL = "http://localhost:8000/create-model";

const VirtualTryOn = () => {
  const [faceFile, setFaceFile] = useState(null);
  const [size, setSize] = useState("medium");
  const [generatedUrl, setGeneratedUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFaceChange = (e) => {
    setFaceFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!faceFile) {
      alert("Please upload a face image");
      return;
    }

    const formData = new FormData();
    formData.append("file", faceFile);
    formData.append("size", size);

    setLoading(true);
    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.model_url) {
        setGeneratedUrl(data.model_url);
      } else {
        alert("Failed: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  return (
    <div className="tryon-container">
      <h1 className="tryon-title">Virtual Try-On (Demo)</h1>

      <form onSubmit={handleSubmit} className="upload-form">
        <label>
          Upload Face Image:
          <input type="file" accept="image/*" onChange={handleFaceChange} />
        </label>

        <label>
          Select Body Size:
          <select value={size} onChange={(e) => setSize(e.target.value)}>
            <option value="tiny">Tiny</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="x-large">X-Large</option>
          </select>
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Create Model"}
        </button>
      </form>

      {generatedUrl && (
        <div className="result-section">
          <h2>Your Generated Model:</h2>
          <img src={generatedUrl} alt="Generated Model" className="generated-img" />
        </div>
      )}
    </div>
  );
};

export default VirtualTryOn;
