/**
 * Positioning Modules
 * Calculate the x, y position of elements
 */

/**
 * Grid-based positioning (standard grid)
 */
export function gridPosition(i, j, cell) {
  const x = i * cell + cell / 2;
  const y = j * cell + cell / 2;
  return { x, y };
}

/**
 * Offset grid positioning (staggered)
 */
export function offsetGridPosition(i, j, cell) {
  const offset = j % 2 === 0 ? 0 : cell / 2;
  const x = i * cell + cell / 2 + offset;
  const y = j * cell + cell / 2;
  return { x, y };
}

/**
 * Circular/spiral positioning
 */
export function spiralPosition(i, total, centerX, centerY, radius) {
  const angle = (i / total) * Math.PI * 2;
  const r = (i / total) * radius;
  const x = centerX + Math.cos(angle) * r;
  const y = centerY + Math.sin(angle) * r;
  return { x, y };
}

/**
 * Random positioning within bounds
 */
export function randomPosition(p5, width, height, seed) {
  if (seed) p5.randomSeed(seed);
  return {
    x: p5.random(width),
    y: p5.random(height),
  };
}

/**
 * Flow field positioning (based on noise)
 */
export function flowFieldPosition(p5, i, cols, rows, cellW, cellH, t) {
  const cx = (i % cols) * cellW + cellW * 0.1;
  const cy = Math.floor(i / cols) * cellH + cellH * 0.5;
  return { x: cx, y: cy, baseX: cx, baseY: cy };
}

