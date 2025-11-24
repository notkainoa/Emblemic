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
  
  // A corner is rounded ONLY if BOTH adjacent sides are NOT connected
  // If either side is connected, the corner must remain sharp (no rounding)
  return {
    topLeft: !hasTop && !hasLeft,
    topRight: !hasTop && !hasRight,
    bottomLeft: !hasBottom && !hasLeft,
    bottomRight: !hasBottom && !hasRight,
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
