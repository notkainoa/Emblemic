import { PixelGrid } from './types';

/**
 * Calculates which corners of a pixel should be rounded based on neighboring pixels
 * @param grid The pixel grid data
 * @param index The index of the pixel to check
 * @returns Object with boolean flags for each corner
 */
export function getSmartRoundedCorners(grid: PixelGrid, index: number): {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
} {
  const { cols, rows, data } = grid;
  const row = Math.floor(index / cols);
  const col = index % cols;
  
  // Check if neighboring pixels exist
  const hasTop = row > 0 && data[index - cols];
  const hasBottom = row < rows - 1 && data[index + cols];
  const hasLeft = col > 0 && data[index - 1];
  const hasRight = col < cols - 1 && data[index + 1];
  
  // Check diagonal neighbors
  const hasTopLeft = row > 0 && col > 0 && data[index - cols - 1];
  const hasTopRight = row > 0 && col < cols - 1 && data[index - cols + 1];
  const hasBottomLeft = row < rows - 1 && col > 0 && data[index + cols - 1];
  const hasBottomRight = row < rows - 1 && col < cols - 1 && data[index + cols + 1];
  
  // A corner is rounded if:
  // 1. The adjacent sides are not connected, OR
  // 2. Both adjacent sides are connected but the diagonal is not
  return {
    topLeft: (!hasTop && !hasLeft) || (hasTop && hasLeft && !hasTopLeft),
    topRight: (!hasTop && !hasRight) || (hasTop && hasRight && !hasTopRight),
    bottomLeft: (!hasBottom && !hasLeft) || (hasBottom && hasLeft && !hasBottomLeft),
    bottomRight: (!hasBottom && !hasRight) || (hasBottom && hasRight && !hasBottomRight),
  };
}

/**
 * Converts corner flags to a CSS border-radius string
 * @param corners Object with boolean flags for each corner
 * @returns CSS border-radius string (e.g., "25% 25% 0% 0%")
 */
export function cornersToBorderRadius(corners: {
  topLeft: boolean;
  topRight: boolean;
  bottomLeft: boolean;
  bottomRight: boolean;
}): string {
  const radius = '25%';
  const noRadius = '0%';
  
  const topLeft = corners.topLeft ? radius : noRadius;
  const topRight = corners.topRight ? radius : noRadius;
  const bottomRight = corners.bottomRight ? radius : noRadius;
  const bottomLeft = corners.bottomLeft ? radius : noRadius;
  
  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}
