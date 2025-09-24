import React, { useEffect, useRef } from "react";

const P5Canvas = ({
  width = 400,
  height = 400,
  sketch = null,
  title = "P5.js Artwork",
  description = "",
  showTitle = true,
  showDescription = true,
}) => {
  const canvasRef = useRef(null);
  const p5InstanceRef = useRef(null);

  useEffect(() => {
    let destroyed = false;
    const container = canvasRef.current;

    const loadP5 = async () => {
      if (window.p5) {
        initializeP5();
        return;
      }

      const p5Script = document.createElement("script");
      p5Script.src = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js";
      p5Script.onload = () => {
        if (!destroyed) {
          initializeP5();
        }
      };
      document.head.appendChild(p5Script);
    };

    const initializeP5 = () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }

      if (container) {
        container.innerHTML = "";
      }

      const p5Sketch = (p5) => {
        const defaultSketch = {
          setup: () => {
            const canvas = p5.createCanvas(width, height);
            canvas.parent(container);
            p5.background(220);
            p5.textAlign(p5.CENTER, p5.CENTER);
            p5.textSize(16);
            p5.fill(100);
            p5.text("P5.js Canvas Ready!", width / 2, height / 2);
          },
          draw: () => {
            p5.background(220, 10);
            p5.fill(p5.frameCount % 255, 100, 150);
            p5.noStroke();
            p5.ellipse(p5.mouseX, p5.mouseY, 20, 20);
          },
        };

        const finalSketch = sketch || defaultSketch;

        if (finalSketch.setup) {
          p5.setup = () => {
            const canvas = p5.createCanvas(width, height);
            canvas.parent(container);
            finalSketch.setup(p5);
          };
        }
        if (finalSketch.draw) p5.draw = () => finalSketch.draw(p5);
        if (finalSketch.mousePressed)
          p5.mousePressed = () => finalSketch.mousePressed(p5);
        if (finalSketch.keyPressed)
          p5.keyPressed = () => finalSketch.keyPressed(p5);
        if (finalSketch.windowResized)
          p5.windowResized = () => finalSketch.windowResized(p5);
      };

      const instance = new window.p5(p5Sketch);
      p5InstanceRef.current = instance;
    };

    loadP5();

    return () => {
      destroyed = true;
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [sketch, width, height]);
  return (
    <div className="p5-canvas-container">
      {showTitle && title && <h3 className="canvas-title">{title}</h3>}
      {showDescription && description && (
        <p className="canvas-description">{description}</p>
      )}
      <div className=""></div>

      <div
        ref={canvasRef}
        className="p5-canvas-wrapper"
        style={{ width: width, height: height }}
      />
    </div>
  );
};

export default P5Canvas;
