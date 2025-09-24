import React from "react";
import P5Canvas from "./P5Canvas";
import artworksData from "../data/artworks.json";
import sketches from "../sketches";

const paletteByCategory = {
  generative: ["#ff5f6d", "#ffc371", "#ff96f9"],
  "data-visualization": ["#21d4fd", "#b721ff", "#3a1c71"],
  geometric: ["#f7971e", "#ffd200", "#ff4e50"],
  mathematical: ["#11998e", "#38ef7d", "#536976"],
  color: ["#bc4e9c", "#f80759", "#ffedbc"],
  interactive: ["#dd5e89", "#f7bb97", "#4b6cb7"],
  default: ["#f5d020", "#f53844", "#42378f"],
};

const getSketchFromFile = (fileName) => {
  return sketches[fileName] || null;
};

const formatSequence = (id) => {
  const numeric = Number.parseInt(id, 10);
  if (Number.isFinite(numeric)) {
    return `${numeric}`.padStart(2, "0");
  }
  return `${id}`;
};

const pickPalette = (category, index) => {
  const basePalette = paletteByCategory[category] || paletteByCategory.default;
  const rotated = [...basePalette];
  const offset = index % basePalette.length;
  return rotated.slice(offset).concat(rotated.slice(0, offset));
};

const ArtworkJourney = () => {
  const publishedArtworks = artworksData.artworks
    .filter((artwork) => artwork.status === "published")
    .sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));

  return (
    <div className="journey">
      <header className="journey-hero">
        <span className="journey-subtitle">Studio log</span>
        <h1 className="journey-title">Signals from an unfinished machine</h1>
        <p className="journey-intro">
          Each sketch is a fragment from a longer conversation with code—less a
          product catalog, more a trail of impulses, experiments, and stray
          signals. Scroll slowly and let the pieces talk to one another.
        </p>
      </header>

      <div className="journey-stream">
        {publishedArtworks.map((artwork, index) => {
          const palette = pickPalette(artwork.category, index);
          const sketch = getSketchFromFile(artwork.file);

          return (
            <section
              key={artwork.id}
              className="journey-section"
              style={{
                "--accent-primary": palette[0],
                "--accent-secondary": palette[1],
                "--accent-tertiary": palette[2],
              }}
            >
              <div className="journey-section-background" aria-hidden="true" />
              <div className="journey-section-content">
                <div className="journey-metadata">
                  <span className="journey-sequence">{formatSequence(artwork.id)}</span>
                  <span className="journey-date">{artwork.date}</span>
                  <span className="journey-category">{artwork.category}</span>
                </div>

                <h2 className="journey-section-title">{artwork.title}</h2>
                <p className="journey-section-description">
                  {artwork.description}
                </p>

                <div className="journey-tags">
                  {artwork.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="journey-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="journey-canvas">
                <div className="journey-canvas-frame">
                  <P5Canvas
                    width={440}
                    height={440}
                    sketch={sketch}
                    title=""
                    description=""
                    showTitle={false}
                    showDescription={false}
                  />
                </div>
                <span className="journey-caption">
                  file: {artwork.file} · seq {artwork.id}
                </span>
              </div>
            </section>
          );
        })}
      </div>

      <footer className="journey-footer">
        <p>
          End of stream—for now. The machine will mutter new shapes again once
          curiosity pulls another thread.
        </p>
      </footer>
    </div>
  );
};

export default ArtworkJourney;
