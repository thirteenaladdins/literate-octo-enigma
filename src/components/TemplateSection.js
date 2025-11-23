import React from "react";
import artworksData from "../data/artworks.json";

// Template display names and descriptions
const templateInfo = {
  gridPattern: {
    name: "Grid Pattern",
    description: "A collection of artworks using the grid pattern template",
  },
  gridPatternModular: {
    name: "Grid Pattern (Modular)",
    description: "Modular grid pattern artworks with plug-and-play modules",
  },
  flowField: {
    name: "Flow Field",
    description: "Artworks featuring flowing fields and currents",
  },
  orbitalMotion: {
    name: "Orbital Motion",
    description: "Celestial movements and orbital patterns",
  },
  noiseWaves: {
    name: "Noise Waves",
    description: "Wave patterns generated with noise functions",
  },
  particleSystem: {
    name: "Particle System",
    description: "Dynamic particle systems and interactions",
  },
  geometricGrid: {
    name: "Geometric Grid",
    description: "Geometric shapes arranged in grid patterns",
  },
  lightning: {
    name: "Lightning",
    description: "Electric currents and lightning-like patterns",
  },
};

const TemplateSection = ({ templateType, onArtworkSelect }) => {
  // Special handling for "other" - artworks without templates
  if (templateType === "other") {
    const otherArtworks = artworksData.artworks
      .filter(
        (artwork) =>
          artwork.status === "published" &&
          !artwork.template &&
          !artwork.tags?.includes("placeholder")
      )
      .sort((a, b) => {
        // Sort by date in reverse chronological order (newest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateB - dateA !== 0) {
          return dateB - dateA;
        }
        // If dates are equal, sort by ID in reverse order
        return parseInt(b.id, 10) - parseInt(a.id, 10);
      });

    if (otherArtworks.length === 0) {
      return null;
    }

    return (
      <div className="template-section">
        <div className="section-header">
          <h2 className="section-title">Other Collection</h2>
          <p className="section-description">
            Artworks that don't use a specific template
          </p>
        </div>
        <div className="artwork-grid">
          {otherArtworks.map((artwork) => (
            <div
              key={artwork.id}
              className="artwork-tile"
              onClick={() => onArtworkSelect(artwork)}
            >
              <div className="artwork-preview">
                <img
                  src={`/thumbnails/${artwork.file}.png`}
                  alt={artwork.title}
                  width={200}
                  height={200}
                  style={{
                    objectFit: "cover",
                    borderRadius: "16px",
                    background: "#222",
                  }}
                  onError={(e) => {
                    // Fallback if thumbnail doesn't exist - try thumbnail property
                    const fallbackSrc = artwork.thumbnail ? `/thumbnails/${artwork.thumbnail}.png` : null;
                    if (fallbackSrc) {
                      e.target.src = fallbackSrc;
                    } else {
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.8rem;">No preview</div>`;
                    }
                  }}
                />
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
          ))}
        </div>
      </div>
    );
  }

  // Get all template variants for this type (e.g., gridPattern and gridPatternModular)
  const templateVariants = Array.isArray(templateType)
    ? templateType
    : [templateType];

  // Filter artworks that use this template type
  const templateArtworks = artworksData.artworks
    .filter(
      (artwork) =>
        artwork.status === "published" &&
        artwork.template &&
        templateVariants.includes(artwork.template) &&
        !artwork.tags?.includes("placeholder")
    )
    .sort((a, b) => {
      // Sort by date in reverse chronological order (newest first)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) {
        return dateB - dateA;
      }
      // If dates are equal, sort by ID in reverse order
      return parseInt(b.id, 10) - parseInt(a.id, 10);
    });

  if (templateArtworks.length === 0) {
    return null;
  }

  // Get display info for the primary template type
  const primaryTemplate = Array.isArray(templateType) ? templateType[0] : templateType;
  const info = templateInfo[primaryTemplate] || {
    name: primaryTemplate,
    description: `Artworks using the ${primaryTemplate} template`,
  };

  return (
    <div className="template-section">
      <div className="section-header">
        <h2 className="section-title">{info.name} Collection</h2>
        <p className="section-description">{info.description}</p>
      </div>
      <div className="artwork-grid">
        {templateArtworks.map((artwork) => (
          <div
            key={artwork.id}
            className="artwork-tile"
            onClick={() => onArtworkSelect(artwork)}
          >
            <div className="artwork-preview">
              <img
                src={`/thumbnails/${artwork.file}.png`}
                alt={artwork.title}
                width={200}
                height={200}
                style={{
                  objectFit: "cover",
                  borderRadius: "16px",
                  background: "#222",
                }}
                onError={(e) => {
                  // Fallback if thumbnail doesn't exist - try thumbnail property
                  const fallbackSrc = artwork.thumbnail ? `/thumbnails/${artwork.thumbnail}.png` : null;
                  if (fallbackSrc) {
                    e.target.src = fallbackSrc;
                  } else {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #666; font-size: 0.8rem;">No preview</div>`;
                  }
                }}
              />
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
        ))}
      </div>
    </div>
  );
};

export default TemplateSection;

