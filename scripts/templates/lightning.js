/**
 * Lightning Template
 * Creates organic flowing patterns with flow field effects and grain
 */
module.exports = function lightning(params) {
  const { colors, density, movement, shapes } = params;

  return `const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    if (typeof CONFIG !== 'undefined' && CONFIG.background) {
      p5.background(CONFIG.background);
    } else {
      p5.background(0, 0, 15);
    }
  },

  draw: (p5) => {
    p5.background(0, 0, 15, 8);
    p5.noFill();
    
    const t = p5.frameCount * ((CONFIG && CONFIG.zSpeed) ? CONFIG.zSpeed : 0.0008);
    const count = (CONFIG && CONFIG.count) || 600;
    const step = (CONFIG && CONFIG.step) || 2.5;
    const strokeAlpha = (CONFIG && CONFIG.strokeAlpha) || 45;
    const noiseScale = (CONFIG && CONFIG.noiseScale) || 0.015;
    const zSpeed = (CONFIG && CONFIG.zSpeed) || 0.0008;
    
    const palette = (CONFIG && CONFIG.palette) || ${JSON.stringify(colors || ["#0074D9", "#39CCCC", "#2ECC40", "#FF4136"])};
    
    // Helper: Convert hex color to HSB array [h, s, b]
    const hexToHSB = (hex) => {
      try {
        const c = p5.color(hex);
        return [p5.hue(c), p5.saturation(c), p5.brightness(c)];
      } catch (e) {
        return [180, 50, 50]; // Default cyan
      }
    };
    
    for (let i = 0; i < count; i++) {
      const colorIndex = i % palette.length;
      const [h, s, b] = hexToHSB(palette[colorIndex]);
      p5.strokeWeight(p5.random(1, 4));
      
      let x = p5.random(p5.width);
      let y = p5.random(p5.height);
      
      p5.beginShape();
      const steps = ${movement.includes("slow") ? "150" : "200"};
      for (let stepIndex = 0; stepIndex < steps; stepIndex++) {
        const angle =
          p5.noise(x * noiseScale, y * noiseScale, t * zSpeed) * p5.TAU * 2;
        x += Math.cos(angle) * step;
        y += Math.sin(angle) * step;
        
        if (x < 0 || y < 0 || x > p5.width || y > p5.height) break;
        
        p5.stroke(h, s, b, strokeAlpha);
        p5.vertex(x, y);
      }
      p5.endShape();
    }
    
    // Grain Layer
    p5.noStroke();
    const grainCount = Math.floor(p5.width * p5.height * 0.03);
    
    for (let i = 0; i < grainCount; i++) {
      const x = p5.random(p5.width);
      const y = p5.random(p5.height);
      const alpha = p5.random(10, 30);
      
      p5.fill(0, 0, p5.random(20, 80), alpha);
      p5.ellipse(x, y, 1.5, 1.5);
    }
  },
};

export default generatedSketch;`;
};
