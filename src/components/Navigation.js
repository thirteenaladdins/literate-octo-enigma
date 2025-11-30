import React from "react";
import { belongsToCollection, filterPublished, getUniqueTemplates, filterByTemplate } from "../utils/artworkHelpers";
import { TEMPLATE_INFO } from "../constants";

const Navigation = ({ activeSection, onSectionChange, activeCollection, artworks = [] }) => {
  // Get all unique templates from the provided artworks
  const allTemplates = getUniqueTemplates(artworks);
  
  // Filter templates to only show those that have artworks in the active collection
  const getTemplatesForCollection = () => {
    if (!activeCollection || !artworks || artworks.length === 0) return allTemplates;

    const templatesWithArtworks = [];

    allTemplates.forEach((template) => {
      if (template === "other") {
        // Check for artworks without templates
        const hasOtherArtworks = filterPublished(artworks).some(
          (artwork) =>
            !artwork.template &&
            !artwork.tags?.includes("placeholder") &&
            belongsToCollection(artwork, activeCollection)
        );
        if (hasOtherArtworks) {
          templatesWithArtworks.push(template);
        }
      } else {
        // For gridPattern, check both gridPattern and gridPatternModular
        const templateVariants = template === "gridPattern" 
          ? ["gridPattern", "gridPatternModular"]
          : [template];
        
        const hasArtworks = filterByTemplate(
          filterPublished(artworks),
          templateVariants
        ).some(
          (artwork) =>
            !artwork.tags?.includes("placeholder") &&
            belongsToCollection(artwork, activeCollection)
        );

        if (hasArtworks) {
          templatesWithArtworks.push(template);
        }
      }
    });

    return templatesWithArtworks;
  };

  const templates = getTemplatesForCollection();
  const allSections = ["all", ...templates];

  // Get display name for template
  const getTemplateName = (section) => {
    if (section === "all") return "All";
    if (section === "other") return "Other";
    const info = TEMPLATE_INFO[section];
    return info?.name || section;
  };

  return (
    <nav className="sidebar-navigation" aria-label="Template navigation">
      <div className="nav-links">
        {allSections.map((section) => (
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
            aria-label={`View ${getTemplateName(section)} artworks`}
          >
            {getTemplateName(section)}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;

