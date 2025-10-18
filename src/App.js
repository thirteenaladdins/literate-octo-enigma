import React, { useState, useEffect } from "react";
import "./App.css";
import ArtworkGrid from "./components/ArtworkGrid";
import ArtworkViewer from "./components/ArtworkViewer";
import TestArtworkButton from "./components/TestArtworkButton";
import artworksData from "./data/artworks.json";

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  // Handle hash-based navigation for direct artwork links
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        // Find artwork by ID (e.g., #019 or #019_ai_signal)
        const artwork = artworksData.artworks.find(
          (art) =>
            art.id === hash ||
            art.file === `${hash}_ai_signal.js` ||
            art.file === `${hash}.js`
        );
        if (artwork) {
          setSelectedArtwork(artwork);
        }
      } else {
        setSelectedArtwork(null);
      }
    };

    // Handle initial hash on load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update hash when artwork is selected
  const handleArtworkSelect = (artwork) => {
    window.location.hash = artwork.id;
    setSelectedArtwork(artwork);
  };

  // Clear hash when going back
  const handleBack = () => {
    window.location.hash = "";
    setSelectedArtwork(null);
  };

  return (
    <div className="App">
      <main className="App-main">
        {selectedArtwork ? (
          <ArtworkViewer artwork={selectedArtwork} onBack={handleBack} />
        ) : (
          <ArtworkGrid onArtworkSelect={handleArtworkSelect} />
        )}
      </main>

      {/* Test button for artwork generation */}
      {process.env.NODE_ENV === "development" && <TestArtworkButton />}
    </div>
  );
}

export default App;
