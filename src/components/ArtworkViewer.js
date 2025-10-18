import React from "react";
import P5Canvas from "./P5Canvas";
import sketches from "../sketches";

const getSketchFromFile = (fileName) => sketches[fileName] || null;

const ArtworkViewer = ({ artwork, onBack }) => {
  const sketch = getSketchFromFile(artwork.file);

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
          <P5Canvas
            width={600}
            height={600}
            sketch={sketch}
            title={artwork.title}
            description={artwork.description}
          />
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
