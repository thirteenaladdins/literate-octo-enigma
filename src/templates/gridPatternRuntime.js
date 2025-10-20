export default function generatedSketchFromConfig(config) {
  const cfg = {
    seed: 37,
    gridSize: 20,
    speed: 0.012,
    fade: 0.08,
    jitter: 0.25,
    shape: "rect",
    background: "#1f1f24",
    palette: ["#06d6a0", "#ffd166", "#ef476f", "#118ab2"],
    ...config,
  };

  return {
    setup: (p5) => {
      p5.randomSeed(cfg.seed);
      p5.noiseSeed(cfg.seed);
      p5.colorMode(p5.HSB, 360, 100, 100, 100);
      p5.background(cfg.background);
      p5.noStroke();
    },
    draw: (p5) => {
      p5.push();
      p5.noStroke();
      p5.fill(0, 0, 0, cfg.fade * 100);
      p5.rect(0, 0, p5.width, p5.height);
      p5.pop();

      const t = p5.frameCount * cfg.speed;
      const g = Math.max(2, Math.floor(cfg.gridSize));
      const cell = Math.min(p5.width, p5.height) / g;

      for (let i = 0; i < g; i++) {
        for (let j = 0; j < g; j++) {
          const x = i * cell + cell / 2;
          const y = j * cell + cell / 2;
          const n = p5.noise(i * 0.1, j * 0.1, t * 0.3);
          const size = cell * 0.6 * (0.5 + n);
          const hue = ((i + j) * 6 + t * 30) % 360;
          const bright = 55 + n * 40;
          p5.fill(hue, 75, bright, 70);

          const jx = (p5.random() - 0.5) * cfg.jitter * cell * 0.2;
          const jy = (p5.random() - 0.5) * cfg.jitter * cell * 0.2;

          if (cfg.shape === "circle") {
            p5.ellipse(x + jx, y + jy, size, size);
          } else if (cfg.shape === "triangle") {
            p5.triangle(
              x + jx,
              y + jy - size / 2,
              x + jx - size / 2,
              y + jy + size / 2,
              x + jx + size / 2,
              y + jy + size / 2
            );
          } else {
            p5.rectMode(p5.CENTER);
            p5.rect(x + jx, y + jy, size, size);
          }
        }
      }
    },
  };
}
