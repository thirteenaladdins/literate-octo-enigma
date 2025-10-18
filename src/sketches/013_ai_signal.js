const generatedSketch = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(0, 0, 8);
  },

  draw: (p5) => {
    p5.background(0, 0, 8, 5);
    p5.noStroke();
    
    const t = p5.frameCount * 0.015;
    const count = 65;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * p5.TWO_PI;
      const noiseVal = p5.noise(i * 0.1, t * 0.5);
      const radius = 80 + noiseVal * 150;
      
      const x = p5.width / 2 + Math.cos(angle + t) * radius;
      const y = p5.height / 2 + Math.sin(angle + t) * radius;
      
      const colorIndex = Math.floor((i / count) * 4);
      const hexColor = "#8E44AD".replace('#', '');
      const r = parseInt(hexColor.substr(0, 2), 16);
      const g = parseInt(hexColor.substr(2, 2), 16);
      const b = parseInt(hexColor.substr(4, 2), 16);
      
      const hue = p5.map(colorIndex, 0, 4, 0, 360);
      const alpha = 30 + noiseVal * 50;
      
      p5.fill(hue, 70, 85, alpha);
      p5.ellipse(x, y, 20 + noiseVal * 15, 20 + noiseVal * 15);
    }
  },
};

export default generatedSketch;