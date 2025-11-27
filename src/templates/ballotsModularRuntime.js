/**
 * Modular Ballots Template
 * Demonstrates the plug-and-play module system for ballot-style compositions
 * Each aspect (subdivision, rotation, coloring, stroke rendering) can be swapped
 */

import { paletteColor, noiseColor, indexColor } from "./modules/coloring";
import {
  noiseRotation,
  constantRotation,
  alternatingRotation,
} from "./modules/rotation";
import {
  renderStraightStrokes,
  renderVerticalStrokes,
  renderDiagonalStrokes,
  renderCurvedStrokes,
} from "./modules/strokes";
import {
  uniformSubdivisions,
  variableSubdivisions,
  alternatingSubdivisions,
} from "./modules/subdivision";
import { solidBackground, noBackground } from "./modules/background";
import { defaultSetup, rgbSetup } from "./modules/setup";

// Default module configuration
const DEFAULT_MODULES = {
  setup: "rgb",
  background: "solid",
  subdivision: "uniform",
  rotation: "noise",
  coloring: "palette",
  strokes: "straight",
};

// Module function maps
const SETUP_MODULES = {
  default: defaultSetup,
  rgb: rgbSetup,
};

const BACKGROUND_MODULES = {
  solid: solidBackground,
  none: noBackground,
};

const SUBDIVISION_MODULES = {
  uniform: uniformSubdivisions,
  variable: variableSubdivisions,
  alternating: alternatingSubdivisions,
};

const ROTATION_MODULES = {
  noise: noiseRotation,
  constant: constantRotation,
  alternating: alternatingRotation,
};

const COLORING_MODULES = {
  palette: paletteColor,
  noise: noiseColor,
  index: indexColor,
};

const STROKE_MODULES = {
  straight: renderStraightStrokes,
  vertical: renderVerticalStrokes,
  diagonal: renderDiagonalStrokes,
  curved: renderCurvedStrokes,
};

export default function ballotsModularRuntime(config) {
  let grid = [];

  // Merge modules with defaults
  const modules = {
    ...DEFAULT_MODULES,
    ...(config.modules || {}),
  };

  // Get module functions (once, outside setup/draw)
  const setupFn = SETUP_MODULES[modules.setup] || defaultSetup;
  const backgroundFn =
    BACKGROUND_MODULES[modules.background] || solidBackground;
  const subdivisionFn =
    SUBDIVISION_MODULES[modules.subdivision] || uniformSubdivisions;
  const rotationFn = ROTATION_MODULES[modules.rotation] || noiseRotation;
  const coloringFn = COLORING_MODULES[modules.coloring] || paletteColor;
  const strokeFn = STROKE_MODULES[modules.strokes] || renderStraightStrokes;

  return {
    setup: (p) => {
      // Set seeds
      if (config.seed) {
        p.randomSeed(config.seed);
        p.noiseSeed(config.seed);
      }

      // Call setup module (handles colorMode, etc.)
      setupFn(p, config);

      const palette = config.palette || ["#1a1a1a", "#4a4a4a", "#7a7a7a"];
      const gridSize = config.gridSize || 5;
      const subdivisions = config.subdivisions || 5;
      const maxRotation = config.rotation || 8;
      const cellSize = p.width / gridSize;
      const margin = cellSize * 0.1;

      grid = [];

      // Generate grid cells with subdivisions
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const x = col * cellSize;
          const y = row * cellSize;

          // Use subdivision module
          const subs = subdivisionFn(
            p,
            col,
            row,
            cellSize,
            margin,
            subdivisions
          );

          const cellSubs = [];
          for (const sub of subs) {
            // Use rotation module
            const rotation = rotationFn(p, col, row, sub.index, maxRotation);
            const offsetX =
              (p.noise(col * 0.3 + 100, row * 0.3 + 100, sub.index * 0.2) -
                0.5) *
              margin *
              2;

            // Use coloring module
            // Trusting the module to return a color we can use, or adapting it simply
            const noiseVal = p.noise(col * 0.4, row * 0.4, sub.index * 0.25);

            // Direct hex/RGB handling for simple cases to match standard runtime exactly
            // For other cases, we rely on the module's return value
            let colorValue;
            if (modules.coloring === "palette") {
              // Standard behavior: direct palette pick based on noise
              const colorIdx =
                p.floor(noiseVal * palette.length) % palette.length;
              colorValue = palette[colorIdx];
            } else {
              // Use module
              const colorResult = coloringFn(p, col, row, 0, noiseVal, palette);

              // Handle object vs string result
              if (
                typeof colorResult === "object" &&
                colorResult.h !== undefined
              ) {
                // Convert HSB object to p5 color in current mode (RGB)
                // This is the simplified conversion logic
                p.push();
                p.colorMode(p.HSB);
                colorValue = p.color(
                  colorResult.h,
                  colorResult.s,
                  colorResult.b,
                  colorResult.a
                );
                p.pop();
              } else {
                colorValue = colorResult;
              }
            }

            cellSubs.push({
              x: x + margin + offsetX,
              y: y + sub.y,
              width: cellSize - 2 * margin,
              height: sub.height,
              rotation: rotation,
              color: colorValue,
              strokes: config.strokeCount || 12,
            });
          }

          grid.push(cellSubs);
        }
      }

      p.noLoop();
    },

    draw: (p) => {
      // Use background module
      backgroundFn(p, config);

      const strokeWeight = config.strokeWeight || 0.8;
      const strokeAlpha = config.strokeAlpha ?? 40;
      const waveAmount = config.waveAmount ?? 0.02;

      for (let cell of grid) {
        for (let sub of cell) {
          p.push();
          p.translate(sub.x + sub.width / 2, sub.y + sub.height / 2);
          p.rotate(p.radians(sub.rotation));

          // Use stroke rendering module
          strokeFn(p, sub, sub.strokes, strokeWeight, strokeAlpha, waveAmount);

          p.pop();
        }
      }
    },
  };
}
