/**
 * Modular Grid Pattern Template
 * Demonstrates the plug-and-play module system
 * Each aspect (positioning, sizing, coloring, rendering) can be swapped
 */

import {
  gridPosition,
  offsetGridPosition,
  spiralPosition,
} from "./modules/positioning";
import {
  noiseSize,
  constantSize,
  distanceSize,
  pulseSize,
} from "./modules/sizing";
import {
  timeBasedColor,
  paletteColor,
  gradientColor,
  noiseColor,
  indexColor,
} from "./modules/coloring";
import { renderShape } from "./modules/rendering";
import {
  noTransform,
  jitterTransform,
  noiseOffsetTransform,
} from "./modules/transform";

// Default module configuration
const DEFAULT_MODULES = {
  positioning: "grid",
  sizing: "noise",
  coloring: "time",
  rendering: "shape",
  transform: "jitter",
};

// Module function map
const POSITIONING_MODULES = {
  grid: gridPosition,
  offsetGrid: offsetGridPosition,
  spiral: spiralPosition,
};

const SIZING_MODULES = {
  noise: noiseSize,
  constant: constantSize,
  distance: distanceSize,
  pulse: pulseSize,
};

const COLORING_MODULES = {
  time: timeBasedColor,
  palette: paletteColor,
  gradient: gradientColor,
  noise: noiseColor,
  index: indexColor,
};

const TRANSFORM_MODULES = {
  none: noTransform,
  jitter: jitterTransform,
  noiseOffset: noiseOffsetTransform,
};

export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 37,
    gridSize: 20,
    speed: 0.012,
    fade: 0.08,
    jitter: 0.25,
    shape: "rect",
    background: "#1f1f24",
    palette: ["#06d6a0", "#ffd166", "#ef476f", "#118ab2"],
    // Module configuration
    modules: DEFAULT_MODULES,
    ...config,
  };

  // Ensure modules are set (can be overridden in config)
  cfg.modules = {
    ...DEFAULT_MODULES,
    ...(config.modules || {}),
  };

  // Get the actual module functions
  const getPositioning = () =>
    POSITIONING_MODULES[cfg.modules.positioning] || gridPosition;
  const getSizing = () => SIZING_MODULES[cfg.modules.sizing] || noiseSize;
  const getColoring = () =>
    COLORING_MODULES[cfg.modules.coloring] || timeBasedColor;
  const getTransform = () =>
    TRANSFORM_MODULES[cfg.modules.transform] || jitterTransform;

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.background(cfg.background);
      p5.noStroke();
    },
    draw: (p5) => {
      // Trail fade
      p5.push();
      p5.noStroke();
      p5.fill(0, 0, 0, cfg.fade * 100);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      const t = p5.frameCount * cfg.speed;
      const g = Math.max(2, Math.floor(cfg.gridSize));
      const cell = Math.min(p5.width, p5.height) / g;

      // Get module functions
      const positionFn = getPositioning();
      const sizeFn = getSizing();
      const colorFn = getColoring();
      const transformFn = getTransform();

      for (let i = 0; i < g; i++) {
        for (let j = 0; j < g; j++) {
          // --- Module 1: Positioning ---
          let pos;
          if (cfg.modules.positioning === "spiral") {
            const centerX = p5.width / 2;
            const centerY = p5.height / 2;
            const radius = Math.min(p5.width, p5.height) / 2;
            const index = i * g + j;
            const total = g * g;
            pos = positionFn(index, total, centerX, centerY, radius);
          } else if (cfg.modules.positioning === "offsetGrid") {
            pos = positionFn(i, j, cell);
          } else {
            // Default grid positioning
            pos = positionFn(i, j, cell);
          }

          // --- Module 2: Sizing ---
          let size;
          const n = p5.noise(i * 0.1, j * 0.1, t * 0.3); // Noise for context

          if (cfg.modules.sizing === "distance") {
            size = sizeFn(p5, i, j, g, g, cell, 1.0);
          } else if (cfg.modules.sizing === "pulse") {
            size = sizeFn(p5, i, j, t, cell, cfg.speed || 1.0);
          } else {
            size = sizeFn(p5, i, j, t, cell);
          }

          // --- Module 3: Coloring ---
          const colorResult = colorFn(p5, i, j, t, n, cfg.palette);

          // Apply color (handle both HSB object and hex string)
          if (typeof colorResult === "object" && colorResult.h !== undefined) {
            p5.fill(colorResult.h, colorResult.s, colorResult.b, colorResult.a);
          } else {
            p5.fill(colorResult);
          }

          // --- Module 4: Transform (jitter/offset) ---
          let finalPos;
          if (cfg.modules.transform === "jitter") {
            finalPos = transformFn(p5, pos.x, pos.y, cfg.jitter || 0.25, cell);
          } else if (cfg.modules.transform === "noiseOffset") {
            finalPos = transformFn(p5, pos.x, pos.y, i, j, t, 0.1, 20);
          } else {
            finalPos = transformFn(p5, pos.x, pos.y);
          }

          // --- Module 5: Rendering ---
          renderShape(p5, finalPos.x, finalPos.y, size, cfg.shape);
        }
      }
    },
  };
}
