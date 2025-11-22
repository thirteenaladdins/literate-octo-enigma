import React from "react";
import "./App.css";
import ArtworkGrid from "./components/ArtworkGrid";
import ArtworkViewer from "./components/ArtworkViewer";
import { useState } from "react";


function App() {
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  return (
    <div className="App">
      <main className="App-main">
        {selectedArtwork ? (
          <ArtworkViewer artwork={selectedArtwork} onBack={() => setSelectedArtwork(null)} />
        ) : (
          <ArtworkGrid onArtworkSelect={setSelectedArtwork} />
        )}
      </main>
    </div>
  );
}

export default App;
