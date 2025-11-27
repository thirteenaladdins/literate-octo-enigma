import React from "react";
import artworksData from "../data/artworks.json";
import { belongsToCollection } from "../utils/artworkHelpers";
import { filterPublished } from "../utils/artworkHelpers";

// Template display names
const templateNames = {
  all: "All",
  gridPattern: "Grid Pattern",
  flowField: "Flow Field",
  orbitalMotion: "Orbital Motion",
  noiseWaves: "Noise Waves",
  particleSystem: "Particle System",
  geometricGrid: "Geometric Grid",
  lightning: "Lightning",
  other: "Other",
};

// Template type mapping for filtering
const TEMPLATE_TYPE_MAP = {
  gridPattern: ["gridPattern", "gridPatternModular"],
  flowField: ["flowField"],
  orbitalMotion: ["orbitalMotion"],
  noiseWaves: ["noiseWaves"],
  particleSystem: ["particleSystem"],
  geometricGrid: ["geometricGrid"],
  lightning: ["lightning"],
};

const Navigation = ({ activeSection, onSectionChange, activeCollection }) => {
  // Get all template sections
  const allSections = [
    "all",
    "gridPattern",
    "flowField",
    "orbitalMotion",
    "noiseWaves",
    "particleSystem",
    "geometricGrid",
    "lightning",
    "other",
  ];

  // Filter sections to only show those that have artworks in the active collection
  const getSectionsForCollection = () => {
    if (!activeCollection) return allSections;

    const sectionsWithArtworks = ["all"]; // Always show "all"

    // Check each template type
    Object.entries(TEMPLATE_TYPE_MAP).forEach(([sectionKey, templateVariants]) => {
      const hasArtworks = filterPublished(artworksData.artworks).some(
        (artwork) =>
          artwork.template &&
          templateVariants.includes(artwork.template) &&
          !artwork.tags?.includes("placeholder") &&
          belongsToCollection(artwork, activeCollection)
      );

      if (hasArtworks) {
        sectionsWithArtworks.push(sectionKey);
      }
    });

    // Check if "other" section has artworks
    const hasOtherArtworks = filterPublished(artworksData.artworks).some(
      (artwork) =>
        !artwork.template &&
        !artwork.tags?.includes("placeholder") &&
        belongsToCollection(artwork, activeCollection)
    );

    if (hasOtherArtworks) {
      sectionsWithArtworks.push("other");
    }

    return sectionsWithArtworks;
  };

  const sections = getSectionsForCollection();

  return (
    <nav className="sidebar-navigation" aria-label="Template navigation">
      <div className="nav-links">
        {sections.map((section) => (
          <div
            key={section}
            className={`nav-link ${activeSection === section ? "active" : ""}`}
            onClick={() => onSectionChange(section)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSectionChange(section);
              }
            }}
            aria-label={`View ${templateNames[section] || section} artworks`}
          >
            {templateNames[section] || section}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;

