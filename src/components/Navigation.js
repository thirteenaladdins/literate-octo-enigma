import React from "react";

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

const Navigation = ({ activeSection, onSectionChange }) => {
  const sections = [
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

  return (
    <nav className="sidebar-navigation">
      <div className="nav-links">
        {sections.map((section) => (
          <div
            key={section}
            className={`nav-link ${activeSection === section ? "active" : ""}`}
            onClick={() => onSectionChange(section)}
          >
            {templateNames[section]}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;

