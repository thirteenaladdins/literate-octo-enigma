import React, { useState } from "react";
import artworksData from "../data/artworks.json";
import { belongsToCollection } from "../utils/artworkHelpers";
import { TEMPLATE_INFO } from "../constants";
import { sortArtworksByDate, filterPublished, filterByTemplate } from "../utils/artworkHelpers";

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
  const imageSrc = artwork.thumbnailUrl || 
                   artwork.imageUrl || 
                   `/thumbnails/${artwork.file}.png`;

  return (
    <div
      className="artwork-tile"
      onClick={() => onArtworkSelect(artwork)}
    >
      <div className="artwork-preview" style={{ position: "relative" }}>
        {!imageError ? (
          <img
            src={imageSrc}
            alt={artwork.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "8px",
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
              borderRadius: "8px",
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


const TemplateSection = ({ templateType, onArtworkSelect, activeCollection }) => {
  // Special handling for "other" - artworks without templates
  if (templateType === "other") {
    const otherArtworks = filterPublished(artworksData.artworks)
      .filter(
        (artwork) =>
          !artwork.template &&
          !artwork.tags?.includes("placeholder") &&
          belongsToCollection(artwork, activeCollection)
      )
      .sort(sortArtworksByDate);

    if (otherArtworks.length === 0) {
      return null;
    }

    return (
      <div className="template-section">
        <div className="section-header">
          <h2 className="section-title">Other</h2>
          <p className="section-description">
            Artworks that don't use a specific template
          </p>
        </div>
        <div className="artwork-grid">
          {otherArtworks.map((artwork) => (
            <ArtworkTile
              key={artwork.id}
              artwork={artwork}
              onArtworkSelect={onArtworkSelect}
                />
          ))}
        </div>
      </div>
    );
  }

  // Get all template variants for this type (e.g., gridPattern and gridPatternModular)
  const templateVariants = Array.isArray(templateType)
    ? templateType
    : [templateType];

  // Filter artworks that use this template type and belong to the active collection
  const templateArtworks = filterByTemplate(
    filterPublished(artworksData.artworks),
    templateVariants
  )
    .filter(
      (artwork) =>
        !artwork.tags?.includes("placeholder") &&
        belongsToCollection(artwork, activeCollection)
    )
    .sort(sortArtworksByDate);

  if (templateArtworks.length === 0) {
    return null;
  }

  // Get display info for the primary template type
  const primaryTemplate = Array.isArray(templateType) ? templateType[0] : templateType;
  const info = TEMPLATE_INFO[primaryTemplate] || {
    name: primaryTemplate,
    description: `Artworks using the ${primaryTemplate} template`,
  };

  return (
    <div className="template-section">
      <div className="section-header">
        <h2 className="section-title">{info.name}</h2>
        <p className="section-description">{info.description}</p>
      </div>
      <div className="artwork-grid">
        {templateArtworks.map((artwork) => (
          <ArtworkTile
            key={artwork.id}
            artwork={artwork}
            onArtworkSelect={onArtworkSelect}
              />
        ))}
      </div>
    </div>
  );
};

export default TemplateSection;

