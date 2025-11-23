export function gridTraversal(p5, config, context, drawElementFn) {
  const { gridSize } = context;
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      drawElementFn(i, j);
    }
  }
}

export function randomTraversal(p5, config, context, drawElementFn) {
  const { gridSize } = context;
  // Use gridSize squared to maintain similar density
  const count = gridSize * gridSize;
  
  for (let k = 0; k < count; k++) {
    // Random float positions within grid range
    const i = p5.random(gridSize);
    const j = p5.random(gridSize);
    drawElementFn(i, j);
  }
}

export function columnTraversal(p5, config, context, drawElementFn) {
    const { gridSize } = context;
    // Iterate down columns
    for (let i = 0; i < gridSize; i++) {
        // Draw a continuous line or more dense points in column?
        // For now just same as grid but strictly column order (no visual diff unless effect depends on order)
        for (let j = 0; j < gridSize; j++) {
            drawElementFn(i, j);
        }
    }
}

