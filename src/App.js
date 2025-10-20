import React, { useState, useEffect } from "react";
import "./App.css";
import ArtworkGrid from "./components/ArtworkGrid";
import ArtworkViewer from "./components/ArtworkViewer";
import TestArtworkButton from "./components/TestArtworkButton";
import TemplateTuner from "./pages/TemplateTuner";
import artworksData from "./data/artworks.json";

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  // Handle path-based navigation for direct artwork links and tuner route (also accept legacy hash)
  useEffect(() => {
    const syncFromLocation = () => {
      const path = window.location.pathname.replace(/^\//, "");
      if (path === "tuner") {
        setSelectedArtwork({ id: null, tuner: true });
        return;
      }
      const pathId = path;
      const hashId = window.location.hash.replace("#", "");
      const id = pathId || hashId;
      if (id) {
        const artwork = artworksData.artworks.find((art) => art.id === id);
        setSelectedArtwork(artwork || null);
      } else {
        setSelectedArtwork(null);
      }
    };

    // Initial sync
    syncFromLocation();

    // Listen for browser navigation and legacy hash changes
    window.addEventListener("popstate", syncFromLocation);
    window.addEventListener("hashchange", syncFromLocation);
    return () => {
      window.removeEventListener("popstate", syncFromLocation);
      window.removeEventListener("hashchange", syncFromLocation);
    };
  }, []);

  // Update hash when artwork is selected
  const handleArtworkSelect = (artwork) => {
    const next = `/${artwork.id}`;
    if (window.location.pathname !== next) {
      window.history.pushState({}, "", next);
    }
    // Clear legacy hash if present
    if (window.location.hash) {
      window.history.replaceState({}, "", next);
    }
    setSelectedArtwork(artwork);
  };

  // Clear hash when going back
  const handleBack = () => {
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
    setSelectedArtwork(null);
  };

  return (
    <div className="App">
      <main className="App-main">
        {selectedArtwork?.tuner ? (
          <TemplateTuner />
        ) : selectedArtwork ? (
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
