import React from "react";
import "./OutfitCard.css";

const OutfitCard = ({ item }) => {
  return (
    <div className="outfit-card">
      <div className="image-wrapper">
        <img src={item.product_photo || item.image || "/fallback.jpg"} alt={item.product_title || "Product"} />
      </div>
      <div className="outfit-details">
        <h3 className="outfit-title">{item.product_title?.slice(0, 60) || "No Title"}</h3>
        <p className="ratings">Rating: {item.product_star_rating ? `${item.product_star_rating}`: ''}</p>
        <p className="outfit-price">Price: {item.product_price ? `${item.product_price}` : "Price not available"}</p>
        <p className="original-price">{item.product_original_price ? `M.R.P: ${item.product_price}` : ''}</p>
        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="outfit-link"
        >
          View Product
        </a>
      </div>
    </div>
  );
};

export default OutfitCard;
