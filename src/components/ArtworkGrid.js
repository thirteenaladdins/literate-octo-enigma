import React, { useState, useEffect } from "react";
import artworksData from "../data/artworks.json";
import { formatErrorMessage } from "../utils/errorHandler";
import { ERROR_MESSAGES } from "../constants";
import { filterPublished, getArtworkImageUrl } from "../utils/artworkHelpers";

// Artwork tile component with image error handling
const ArtworkTile = ({ artwork, onArtworkSelect }) => {
  const [imageError, setImageError] = useState(false);
  const [triedFallback, setTriedFallback] = useState(false);
  
  const handleImageError = (e) => {
    if (!triedFallback && artwork.thumbnail) {
      // Try fallback thumbnail
      setTriedFallback(true);
      e.target.src = `/thumbnails/${artwork.thumbnail}.png`;
    } else {
      // Both failed - show placeholder
      setImageError(true);
    }
  };

  // Determine image source: prefer remote URL, then local path
  const imageSrc = getArtworkImageUrl(artwork, "thumbnail");

  return (
    <div
      className="artwork-tile"
      onClick={() => onArtworkSelect(artwork)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onArtworkSelect(artwork);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`View artwork: ${artwork.title}`}
    >
      <div className="artwork-preview" style={{ position: "relative" }}>
        {!imageError ? (
          <img
            src={imageSrc}
            alt={artwork.title}
            width={200}
            height={200}
            loading="lazy"
            style={{
              objectFit: "cover",
              borderRadius: "16px",
              background: "#222",
              display: "block",
            }}
            onError={handleImageError}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
              fontSize: "0.8rem",
              background: "#222",
              borderRadius: "16px",
            }}
          >
            No preview
          </div>
        )}
      </div>
      <div className="artwork-info">
        <h3>{artwork.title}</h3>
        <p>{artwork.description}</p>
        <div className="artwork-meta">
          <span className="artwork-date">{artwork.date}</span>
          <span className="artwork-category">{artwork.category}</span>
        </div>
        <div className="artwork-tags">
          {artwork.tags.map((tag, tagIndex) => (
            <span key={tagIndex} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ArtworkGrid = ({ onArtworkSelect }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    try {
      setLoading(true);
      const publishedArtworks = filterPublished(artworksData.artworks)
        .filter(
          (artwork) => !artwork.template // Only show artworks without a template
        )
        .sort((a, b) => {
          // Sort by ID in reverse chronological order (highest first)
          return parseInt(b.id, 10) - parseInt(a.id, 10);
        });
      setArtworks(publishedArtworks);
      setLoading(false);
    } catch (err) {
      setError(formatErrorMessage(err) || ERROR_MESSAGES.LOAD_FAILED);
      setLoading(false);
    }
  };

  const filteredArtworks = artworks.filter((artwork) => {
    const matchesCategory =
      selectedCategory === "all" || artwork.category === selectedCategory;
    const matchesSearch =
      artwork.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artwork.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const categories = ["all", ...artworksData.categories];

  if (loading) {
    return (
      <div className="artwork-grid">
        <div className="loading">Loading artworks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artwork-grid">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid-header">
        <p className="grid-description">
          A collection of generative art and interactive sketches
        </p>

        <div className="grid-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search artworks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all"
                    ? "All Categories"
                    : category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-stats">
          <span>
            {filteredArtworks.length} of {artworks.length} artworks
          </span>
        </div>
      </div>

      <div className="artwork-grid">
        {filteredArtworks.length === 0 ? (
          <div className="no-results">
            <p>No artworks found matching your criteria.</p>
          </div>
        ) : (
          filteredArtworks.map((artwork) => (
            <ArtworkTile
              key={artwork.id}
              artwork={artwork}
              onArtworkSelect={onArtworkSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ArtworkGrid;
