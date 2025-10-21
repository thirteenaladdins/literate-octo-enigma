const CONFIG = {
  "seed": 6,
  "numOrbits": 24,
  "orbitSpeed": 0.012,
  "trailFade": 0.734,
  "radiusMin": 543.575,
  "radiusMax": 256.199,
  "lineWeight": 4.09,
  "background": "#0e0f1a",
  "palette": [
    "#f72585",
    "#7209b7",
    "#3a0ca3",
    "#4361ee"
  ]
};
const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 10);
  },

  draw: (p5) => {
    p5.background(0, 0, 10, 10);
    p5.noStroke();
    
    const t = p5.frameCount * ((CONFIG && CONFIG.orbitSpeed) || 0.02);
    const count = (CONFIG && CONFIG.numOrbits) || 75;
    
    for (let i = 0; i < count; i++) {
      const angle = t + (i / count) * p5.TWO_PI;
      const orbitRadius = ((CONFIG && CONFIG.radiusMin) || 60) + (i % 3) * (((CONFIG && CONFIG.radiusMax) || 400) / 6);
      const noiseVal = p5.noise(i * 0.08, t * 0.4);
      
      const radius = orbitRadius + 40 * noiseVal;
      const x = p5.width / 2 + radius * Math.cos(angle);
      const y = p5.height / 2 + radius * Math.sin(angle);
      
      const hue = (180 + i * (360 / Math.max(count,1)) + t * 60) % 360;
      const alpha = 40 + 45 * noiseVal;
      
      p5.fill(hue, 70, 90, alpha);
      const shapeSize = 16 + noiseVal * 12;
      p5.ellipse(x, y, shapeSize, shapeSize);
    }
    
    if (p5.frameCount % 180 === 0) {
      p5.background(0, 0, 10, 20);
    }
  },
};

export default generatedSketch;