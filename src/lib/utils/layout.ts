export function radialExpansion(
  centerPoint: { x: number; y: number },
  nodes: any[],
  baseIndex: number = 0 // Allows extending an existing fan
) {
  if (nodes.length === 0) return nodes;

  const layerCapacity = [2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12];
  const COL_WIDTH = 350;
  const FIRST_COL_OFFSET = 450;

  // Figure out which layer to start in based on baseIndex
  let currentLayer = 0;
  let nodesInCurrentLayer = 0;
  
  // Fast forward to baseIndex
  for (let i = 0; i < baseIndex; i++) {
    nodesInCurrentLayer++;
    if (nodesInCurrentLayer >= layerCapacity[currentLayer]) {
      currentLayer++;
      nodesInCurrentLayer = 0;
    }
  }

  const layers: any[][] = [];
  let layerOffset = currentLayer;
  
  nodes.forEach((n) => {
    if (!layers[currentLayer - layerOffset]) {
      layers[currentLayer - layerOffset] = [];
    }
    layers[currentLayer - layerOffset].push(n);
    nodesInCurrentLayer++;
    if (nodesInCurrentLayer >= layerCapacity[currentLayer]) {
      currentLayer++;
      nodesInCurrentLayer = 0;
    }
  });

  let nodeIdx = 0;
  const result = [...nodes];

  layers.forEach((layerNodes, idx) => {
    const colIndex = layerOffset + idx;
    const spread = colIndex === 0 ? 500 : colIndex === 1 ? 800 : 700 + (colIndex - 2) * 100;
    
    const startY = layerNodes.length === 1 ? centerPoint.y : centerPoint.y - spread / 2;
    const stepY = layerNodes.length === 1 ? 0 : spread / (layerNodes.length - 1);
    
    layerNodes.forEach((n, i) => {
      result[nodeIdx].x = centerPoint.x + FIRST_COL_OFFSET + colIndex * COL_WIDTH;
      result[nodeIdx].y = startY + i * stepY;
      nodeIdx++;
    });
  });

  return result;
}

export function chronologicalTimeline(
  startPoint: { x: number; y: number },
  nodes: any[]
) {
  // Sort nodes by year
  const sorted = [...nodes].sort((a, b) => (a.year || 0) - (b.year || 0));
  
  const X_GAP = 400;
  
  sorted.forEach((n, i) => {
    n.x = startPoint.x + i * X_GAP;
    n.y = startPoint.y + (i % 2 === 0 ? -100 : 100); // Stagger slightly up and down
  });
  
  return sorted;
}

export function thematicClustering(
  startPoint: { x: number; y: number },
  clusters: { theme: string; nodes: any[] }[]
) {
  const CLUSTER_GAP_X = 600;
  const CLUSTER_GAP_Y = 500;
  
  let currentX = startPoint.x;
  let currentY = startPoint.y;
  
  clusters.forEach((cluster, i) => {
    // 2 columns per cluster
    cluster.nodes.forEach((n, j) => {
      n.x = currentX + (j % 2) * 350;
      n.y = currentY + Math.floor(j / 2) * 200;
    });
    
    currentX += CLUSTER_GAP_X;
    if (i > 0 && i % 2 === 0) {
      currentX = startPoint.x;
      currentY += CLUSTER_GAP_Y;
    }
  });
}

export function cleanupLayout(nodes: any[]) {
  // A simplistic cleanup that tries to snap nodes to a grid to reduce overlap
  // without moving them too far from their original position.
  const GRID_SIZE = 200;
  const occupied = new Set<string>();

  const getGridKey = (x: number, y: number) => `${Math.round(x/GRID_SIZE)},${Math.round(y/GRID_SIZE)}`;

  nodes.forEach(n => {
    let bestX = n.x;
    let bestY = n.y;
    let radius = 0;
    let placed = false;
    
    while (!placed) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius && radius !== 0) continue;
          
          const testX = n.x + dx * GRID_SIZE;
          const testY = n.y + dy * GRID_SIZE;
          const key = getGridKey(testX, testY);
          
          if (!occupied.has(key)) {
            bestX = testX;
            bestY = testY;
            occupied.add(key);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      radius++;
    }
    
    n.x = bestX;
    n.y = bestY;
  });
  
  return nodes;
}
