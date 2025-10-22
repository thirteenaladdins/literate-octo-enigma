const CONFIG = {
  "seed": 7,
  "frequency": 4.232,
  "amplitude": 28.48,
  "bands": 4,
  "speed": 0.004,
  "lineWeight": 2.388,
  "fade": 0.425,
  "background": "#0b0b12",
  "palette": [
    "#90e0ef",
    "#48cae4",
    "#00b4d8",
    "#03045e"
  ]
};
const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 12);
  },

  draw: (p5) => {
    p5.background(0, 0, 12, 10);
    p5.noFill();
    p5.strokeWeight((CONFIG && CONFIG.lineWeight) || 3);
    
    const t = p5.frameCount * ((CONFIG && CONFIG.speed) || 0.015);
    const waveCount = Math.max(2, Math.floor(((CONFIG && CONFIG.bands) || 70) / 3));
    
    for (let w = 0; w < waveCount; w++) {
      const yOffset = (w / waveCount) * p5.height;
      const hue = (w * (360 / waveCount) + t * 25) % 360;
      
      p5.stroke(hue, 70, 85, 60);
      p5.beginShape();
      
      for (let x = 0; x < p5.width; x += 8) {
        const noiseVal = p5.noise(x * 0.01 * ((CONFIG && CONFIG.frequency) || 1), w * 0.5, t * 0.3);
        const y = yOffset + noiseVal * (((CONFIG && CONFIG.amplitude) || 80)) - (((CONFIG && CONFIG.amplitude) || 80) / 2);
        p5.vertex(x, y);
      }
      p5.endShape();
    }
  },
};

export default generatedSketch;