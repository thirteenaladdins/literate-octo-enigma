import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import ArtworkGrid from "./components/ArtworkGrid";
import ArtworkViewer from "./components/ArtworkViewer";

function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "viewer"

  const handleArtworkSelect = (artwork) => {
    setSelectedArtwork(artwork);
    setViewMode("viewer");
  };

  const handleBackToGrid = () => {
    setSelectedArtwork(null);
    setViewMode("grid");
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>P5.js Artwork Portfolio</h1>
      </header>

      <main className="App-main">
        {viewMode === "grid" ? (
          <ArtworkGrid onArtworkSelect={handleArtworkSelect} />
        ) : (
          <ArtworkViewer artwork={selectedArtwork} onBack={handleBackToGrid} />
        )}
      </main>
    </div>
  );
}

export default App;
