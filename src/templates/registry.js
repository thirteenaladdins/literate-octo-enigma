#!/usr/bin/env node

/**
 * Template Registry
 * Declares capabilities and required inputs for each template
 */
module.exports = {
  gridPattern: {
    name: "Grid Pattern",
    inputs: ["seed", "gridSize", "speed", "fade", "jitter", "shape", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["circle", "rect", "triangle"],
      animation: "continuous",
      interaction: false,
    },
    description: "Structured grid-based compositions with animated elements",
  },
  particleSystem: {
    name: "Particle System",
    inputs: ["seed", "count", "speed", "noiseScale", "trailLength", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["circle", "ellipse"],
      animation: "continuous",
      interaction: true,
    },
    description: "Organic floating particles with trail effects",
  },
  orbitalMotion: {
    name: "Orbital Motion",
    inputs: ["seed", "count", "speed", "radius", "trail", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["circle", "ellipse"],
      animation: "orbital",
      interaction: false,
    },
    description: "Circular orbiting patterns with trailing effects",
  },
  flowField: {
    name: "Flow Field",
    inputs: ["seed", "density", "speed", "noiseScale", "strokeWeight", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["line", "curve"],
      animation: "flowing",
      interaction: false,
    },
    description: "Flowing organic patterns using Perlin noise fields",
  },
  noiseWaves: {
    name: "Noise Waves",
    inputs: ["seed", "frequency", "amplitude", "bands", "speed", "lineWeight", "fade", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["line", "curve"],
      animation: "wave",
      interaction: false,
    },
    description: "Wave-like patterns using Perlin noise",
  },
  geometricGrid: {
    name: "Geometric Grid",
    inputs: ["seed", "gridSize", "rotation", "scale", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["rect", "circle"],
      animation: "static",
      interaction: false,
    },
    description: "Static geometric grid patterns",
  },
  ballots: {
    name: "Ballots",
    inputs: ["seed", "rows", "columns", "text", "background", "palette"],
    capabilities: {
      colors: true,
      shapes: ["text", "rect"],
      animation: "static",
      interaction: false,
      text: true,
    },
    description: "Ballot-style text-based compositions",
  },
};

