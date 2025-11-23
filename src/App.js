import React from "react";
import "./App.css";
import ArtworkGrid from "./components/ArtworkGrid";
import ArtworkViewer from "./components/ArtworkViewer";
import TemplateSection from "./components/TemplateSection";
import Navigation from "./components/Navigation";
import { useState } from "react";

// Define all template types in the order they should appear
const TEMPLATE_TYPES = [
  "gridPattern", // Includes gridPatternModular
  "flowField",
  "orbitalMotion",
  "noiseWaves",
  "particleSystem",
  "geometricGrid",
  "lightning",
  "other",
];

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [activeSection, setActiveSection] = useState("all");

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Scroll to top when changing sections
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderContent = () => {
    if (activeSection === "all") {
      // Show all template sections
      return (
        <>
          {TEMPLATE_TYPES.map((templateType) => {
            // Special handling for gridPattern to include both variants
            const template = templateType === "gridPattern" 
              ? ["gridPattern", "gridPatternModular"]
              : templateType;
            return (
              <TemplateSection
                key={templateType}
                templateType={template}
                onArtworkSelect={setSelectedArtwork}
              />
            );
          })}
        </>
      );
    } else {
      // Show only the selected template section
      const template = activeSection === "gridPattern" 
        ? ["gridPattern", "gridPatternModular"]
        : activeSection;
      return (
        <TemplateSection
          templateType={template}
          onArtworkSelect={setSelectedArtwork}
        />
      );
    }
  };

  return (
    <div className="App">
      <div className={`app-layout ${selectedArtwork ? "no-sidebar" : ""}`}>
        {!selectedArtwork && (
          <Navigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        )}
        <main className="App-main">
          {selectedArtwork ? (
            <ArtworkViewer artwork={selectedArtwork} onBack={() => setSelectedArtwork(null)} />
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
