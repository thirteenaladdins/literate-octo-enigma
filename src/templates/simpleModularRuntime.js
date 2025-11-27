import { gridTraversal } from "./modules/traversal";
import { pulseSize } from "./modules/sizing";
import { gradientColor } from "./modules/coloring";
import { renderCross } from "./modules/rendering";
import { defaultSetup } from "./modules/setup";
import { solidBackground } from "./modules/background";

/**
 * Simple Modular Runtime
 * A demonstration of composing a template from 4 distinct modules:
 * 1. Traversal: Grid (determines where to draw)
 * 2. Sizing: Pulse (determines size over time)
 * 3. Coloring: Gradient (determines color by position)
 * 4. Rendering: Cross (determines shape)
 */
export default function generatedSketchFromConfig(config) {
  const gridSize = config.gridSize || 12;
  const palette = config.palette || ["#00A8E8", "#007EA7", "#003459"];

  return {
    setup: (p) => {
      if (config.seed) {
        p.randomSeed(config.seed);
        p.noiseSeed(config.seed);
      }
      
      // Use standard setup (HSB mode)
      defaultSetup(p, config);
    },

    draw: (p) => {
      // Clear background
      solidBackground(p, config);
      
      // Calculate time for animation
      const t = p.millis() * 0.001;
      
      // Use Grid Traversal Module
      gridTraversal(
        p, 
        config, 
        { gridSize }, 
        (i, j) => {
          // Calculate cell size
          const cell = p.width / gridSize;
          const x = i * cell + cell / 2;
          const y = j * cell + cell / 2;
          
          // Use Sizing Module (Pulse)
          // pulseSize(p5, i, j, t, cell, pulseSpeed)
          const size = pulseSize(p, i, j, t, cell, 2.0);
          
          // Use Coloring Module (Gradient)
          // gradientColor(p5, i, j, maxI, maxJ, palette)
          const col = gradientColor(p, i, j, gridSize, gridSize, palette);
          
          // Apply color
          if (col) {
            p.stroke(col.h, col.s, col.b, col.a || 100);
            p.strokeWeight(2);
          }
          
          // Use Rendering Module (Cross)
          renderCross(p, x, y, size);
        }
      );
    }
  };
}

