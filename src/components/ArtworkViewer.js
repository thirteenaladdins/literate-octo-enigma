import React from "react";
import P5Canvas from "./P5Canvas";
import sketches from "../sketches";
// Runtime templates for parameter-based rendering
import flowFieldRuntime from "../templates/flowFieldRuntime";
import particleSystemRuntime from "../templates/particleSystemRuntime";
import orbitalMotionRuntime from "../templates/orbitalMotionRuntime";
import noiseWavesRuntime from "../templates/noiseWavesRuntime";
import geometricGridRuntime from "../templates/geometricGridRuntime";
import gridPatternRuntime from "../templates/gridPatternRuntime";
import lightningRuntime from "../templates/lightningRuntime";
import ballotsRuntime from "../templates/ballotsRuntime";

const runtimeTemplates = {
  flowField: flowFieldRuntime,
  particleSystem: particleSystemRuntime,
  orbitalMotion: orbitalMotionRuntime,
  noiseWaves: noiseWavesRuntime,
  geometricGrid: geometricGridRuntime,
  gridPattern: gridPatternRuntime,
  lightning: lightningRuntime,
  ballots: ballotsRuntime,
};

// Get sketch from file (legacy) or generate from config (new parameter-based)
const getSketch = (artwork) => {
  // Try parameter-based rendering first (new approach)
  if (artwork.config && artwork.template) {
    const runtimeTemplate = runtimeTemplates[artwork.template];
    if (runtimeTemplate) {
      console.log(
        `Rendering artwork ${artwork.id} from config using ${artwork.template} runtime template`
      );
      // Ensure seed is set in config for reproducibility
      const configWithSeed = {
        ...artwork.config,
        seed: artwork.seed || artwork.config.seed,
      };
      return runtimeTemplate(configWithSeed);
    }
  }

  // Fallback to legacy JS file approach
  return sketches[artwork.file] || null;
};

const ArtworkViewer = ({ artwork, onBack }) => {
  const sketch = getSketch(artwork);

  return (
    <div className="artwork-viewer">
      <div className="viewer-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Gallery
        </button>
        <div className="artwork-header-info">
          <h2>{artwork.title}</h2>
          <span className="artwork-id">#{artwork.id}</span>
        </div>
      </div>

      <div className="artwork-content">
        <div className="artwork-canvas">
          {artwork.displayMode === "image" ? (
            <img
              src={`/thumbnails/${artwork.file}.png`}
              alt={artwork.title}
              width={600}
              height={600}
              onError={(e) => {
                // Hide broken image and fallback to live P5 render
                e.currentTarget.style.display = "none";
              }}
              style={{ objectFit: "cover", borderRadius: 12 }}
            />
          ) : sketch ? (
            <P5Canvas
              width={600}
              height={600}
              sketch={sketch}
              title={artwork.title}
              description={artwork.description}
            />
          ) : (
            <div
              style={{
                width: 600,
                height: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#1a1a1a",
                borderRadius: 12,
                color: "#666",
              }}
            >
              No sketch available
            </div>
          )}
        </div>

        <div className="artwork-details">
          <div className="detail-section">
            <h3>About this artwork</h3>
            <p>{artwork.description}</p>
          </div>

          <div className="detail-section">
            <h3>Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{artwork.date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{artwork.category}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{artwork.status}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3>Tags</h3>
            <div className="artwork-tags">
              {artwork.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-section">
            <h3>File Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">File:</span>
                <span className="detail-value">{artwork.file}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ID:</span>
                <span className="detail-value">{artwork.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtworkViewer;
