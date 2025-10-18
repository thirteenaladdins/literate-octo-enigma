import React, { useState, useEffect } from "react";
import P5Canvas from "./P5Canvas";
import artworksData from "../data/artworks.json";
import sketches from "../sketches";

const getSketchFromFile = (fileName) => sketches[fileName] || null;

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
      const publishedArtworks = artworksData.artworks
        .filter((artwork) => artwork.status === "published")
        .reverse();
      setArtworks(publishedArtworks);
      setLoading(false);
    } catch (err) {
      setError("Failed to load artworks");
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
        <h1 className="grid-banner">Whispers from an Unfinished Machine</h1>
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
            <div
              key={artwork.id}
              className="artwork-tile"
              onClick={() => onArtworkSelect(artwork)}
            >
              <div className="artwork-preview">
                {/* Prefer static thumbnail if available */}
                {artwork.displayMode === "image" ? (
                  <img
                    src={`/thumbnails/${artwork.file}.png`}
                    alt={artwork.title}
                    width={200}
                    height={200}
                    onError={(e) => {
                      // Fallback to live sketch preview if image missing
                      e.currentTarget.style.display = "none";
                    }}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                ) : (
                  <P5Canvas
                    width={200}
                    height={200}
                    sketch={getSketchFromFile(artwork.file)}
                    showTitle={false}
                    showDescription={false}
                  />
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
          ))
        )}
      </div>
    </div>
  );
};

export default ArtworkGrid;
