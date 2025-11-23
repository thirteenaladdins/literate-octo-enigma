/**
 * Modular Grid Pattern Template
 * Demonstrates the plug-and-play module system
 * Each aspect (positioning, sizing, coloring, rendering, setup, traversal, background, context) can be swapped
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
import { defaultSetup, invertedSetup } from "./modules/setup";
import {
  transparentFade,
  solidBackground,
  noBackground,
} from "./modules/background";
import {
  gridTraversal,
  randomTraversal,
  columnTraversal,
} from "./modules/traversal";
import { timeBasedContext, mouseBasedContext } from "./modules/context";

// Default module configuration
const DEFAULT_MODULES = {
  setup: "default",
  background: "transparent",
  context: "time",
  traversal: "grid",
  positioning: "grid",
  sizing: "noise",
  coloring: "time",
  rendering: "shape",
  transform: "none",
};

// Module function maps
const SETUP_MODULES = {
  default: defaultSetup,
  inverted: invertedSetup,
};

const BACKGROUND_MODULES = {
  transparent: transparentFade,
  solid: solidBackground,
  none: noBackground,
};

const CONTEXT_MODULES = {
  time: timeBasedContext,
  mouse: mouseBasedContext,
};

const TRAVERSAL_MODULES = {
  grid: gridTraversal,
  random: randomTraversal,
  column: columnTraversal,
};

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
  // Config is already complete from schema generation - no defaults needed
  // Only merge modules if provided
  const modules = {
    ...DEFAULT_MODULES,
    ...(config.modules || {}),
  };

  // Get the actual module functions
  const getSetup = () => SETUP_MODULES[modules.setup] || defaultSetup;
  const getBackground = () =>
    BACKGROUND_MODULES[modules.background] || transparentFade;
  const getContext = () => CONTEXT_MODULES[modules.context] || timeBasedContext;
  const getTraversal = () =>
    TRAVERSAL_MODULES[modules.traversal] || gridTraversal;

  const getPositioning = () =>
    POSITIONING_MODULES[modules.positioning] || gridPosition;
  const getSizing = () => SIZING_MODULES[modules.sizing] || noiseSize;
  const getColoring = () =>
    COLORING_MODULES[modules.coloring] || timeBasedColor;
  const getTransform = () =>
    TRANSFORM_MODULES[modules.transform] || noTransform;

  return {
    setup: (p5) => {
      // Only set seed if provided (seed should always be provided)
      if (config.seed) {
        p5.randomSeed(config.seed);
        p5.noiseSeed(config.seed);
      }

      // Call setup module
      const setupFn = getSetup();
      setupFn(p5, config);
    },
    draw: (p5) => {
      // Call background module
      const backgroundFn = getBackground();
      backgroundFn(p5, config);

      // Get context (time, grid size, etc.)
      const contextFn = getContext();
      const context = contextFn(p5, config);
      const { t, cellSize } = context;

      // Get other module functions
      const positionFn = getPositioning();
      const sizeFn = getSizing();
      const colorFn = getColoring();
      const transformFn = getTransform();
      const traversalFn = getTraversal();

      // Define the element drawing logic
      const drawElement = (i, j) => {
        // --- Module 1: Positioning ---
        const pos = positionFn(i, j, cellSize);

        // --- Module 2: Sizing ---
        // Calculate noise value for the current position/time
        const noiseVal = p5.noise(i * 0.1, j * 0.1, t * 0.3);
        // Use sizing module
        const size = sizeFn(p5, i, j, t, cellSize, 0.1);

        // --- Module 3: Coloring ---
        const colorResult = colorFn(p5, i, j, t, noiseVal, config.palette);

        // Apply color
        if (typeof colorResult === "object" && colorResult.h !== undefined) {
          p5.fill(colorResult.h, colorResult.s, colorResult.b, colorResult.a);
        } else {
          p5.fill(colorResult);
        }

        // --- Module 4: Transform ---
        const finalPos = transformFn(p5, pos.x, pos.y);

        // --- Module 5: Rendering ---
        if (size > 0 && !isNaN(size)) {
          renderShape(p5, finalPos.x, finalPos.y, size, config.shape);
        }
      };

      // Execute traversal with the drawing callback
      traversalFn(p5, config, context, drawElement);
    },
  };
}
