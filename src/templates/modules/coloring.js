/**
 * Coloring Modules
 * Calculate the color of elements
 */

/**
 * Time-based color cycling (HSB)
 */
export function timeBasedColor(p5, i, j, t, n, palette) {
  const hue = ((i + j) * 6 + t * 30) % 360;
  const bright = 55 + n * 40;
  return { h: hue, s: 75, b: bright, a: 70 };
}

/**
 * Palette-based coloring (from config palette)
 */
export function paletteColor(p5, i, j, t, n, palette) {
  const index = Math.floor(n * palette.length) % palette.length;
  const hex = palette[index];
  // Convert hex to HSB
  try {
    const c = p5.color(hex);
    return {
      h: p5.hue(c),
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 }; // Default cyan
  }
}

/**
 * Gradient coloring (based on position)
 */
export function gradientColor(p5, i, j, maxI, maxJ, palette) {
  const ratioX = i / maxI;
  const ratioY = j / maxJ;
  const ratio = (ratioX + ratioY) / 2;
  
  const index1 = Math.floor(ratio * (palette.length - 1));
  const index2 = Math.min(index1 + 1, palette.length - 1);
  const blend = (ratio * (palette.length - 1)) % 1;
  
  try {
    const c1 = p5.color(palette[index1]);
    const c2 = p5.color(palette[index2]);
    const c = p5.lerpColor(c1, c2, blend);
    return {
      h: p5.hue(c),
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}

/**
 * Noise-based color variation
 */
export function noiseColor(p5, i, j, t, noiseScale = 0.1, palette) {
  const n = p5.noise(i * noiseScale, j * noiseScale, t);
  const index = Math.floor(n * palette.length) % palette.length;
  try {
    const c = p5.color(palette[index]);
    return {
      h: (p5.hue(c) + t * 2) % 360,
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}

/**
 * Index-based color (cycled through palette)
 */
export function indexColor(p5, i, j, palette) {
  const index = (i + j) % palette.length;
  try {
    const c = p5.color(palette[index]);
    return {
      h: p5.hue(c),
      s: p5.saturation(c),
      b: p5.brightness(c),
      a: 70,
    };
  } catch (e) {
    return { h: 180, s: 50, b: 50, a: 70 };
  }
}

