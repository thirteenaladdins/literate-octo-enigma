/**
 * Rendering Modules
 * Draw shapes/elements
 */

/**
 * Render circle
 */
export function renderCircle(p5, x, y, size) {
  p5.ellipse(x, y, size, size);
}

/**
 * Render rectangle
 */
export function renderRect(p5, x, y, size) {
  p5.rectMode(p5.CENTER);
  p5.rect(x, y, size, size);
}

/**
 * Render triangle
 */
export function renderTriangle(p5, x, y, size) {
  p5.triangle(
    x,
    y - size / 2,
    x - size / 2,
    y + size / 2,
    x + size / 2,
    y + size / 2
  );
}

/**
 * Render line
 */
export function renderLine(p5, x, y, size, angle = 0) {
  p5.push();
  p5.translate(x, y);
  p5.rotate(angle);
  p5.line(-size / 2, 0, size / 2, 0);
  p5.pop();
}

/**
 * Render cross
 */
export function renderCross(p5, x, y, size) {
  const halfSize = size / 2;
  p5.line(x - halfSize, y, x + halfSize, y);
  p5.line(x, y - halfSize, x, y + halfSize);
}

/**
 * Shape switcher (renders based on shape name)
 */
export function renderShape(p5, x, y, size, shape = "circle") {
  switch (shape.toLowerCase()) {
    case "circle":
      renderCircle(p5, x, y, size);
      break;
    case "rect":
    case "rectangle":
    case "square":
      renderRect(p5, x, y, size);
      break;
    case "triangle":
      renderTriangle(p5, x, y, size);
      break;
    case "line":
      renderLine(p5, x, y, size);
      break;
    case "cross":
      renderCross(p5, x, y, size);
      break;
    default:
      renderCircle(p5, x, y, size); // Default to circle
  }
}

