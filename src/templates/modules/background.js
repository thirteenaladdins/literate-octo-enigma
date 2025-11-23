export function transparentFade(p5, config) {
  // Assumes HSB mode from default setup, or works reasonably in RGB
  p5.background(
    0,
    0,
    12,
    Math.min(100, Math.max(0, config.fade ? config.fade * 100 : 8))
  );
}

export function solidBackground(p5, config) {
  p5.background(0, 0, 12);
}

export function noBackground(p5, config) {
  // No background clear
}

