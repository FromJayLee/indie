import { Mulberry32 } from './random';

export interface Point {
  x: number;
  y: number;
}

export interface PoissonConfig {
  width: number;
  height: number;
  minDistance: number;
  maxAttempts?: number;
  centerBias?: number; // 0-1, higher = more points near center
}

/**
 * 2D Poisson-disk sampling implementation
 * Generates points with minimum distance constraint
 */
export class PoissonSampler {
  private rng: Mulberry32;
  private grid: (Point | null)[][];
  private cellSize: number;
  private gridWidth: number;
  private gridHeight: number;
  private activeList: Point[] = [];

  constructor(rng: Mulberry32) {
    this.rng = rng;
    this.grid = [];
    this.cellSize = 0;
    this.gridWidth = 0;
    this.gridHeight = 0;
  }

  /**
   * Generate Poisson-disk sampled points
   */
  sample(config: PoissonConfig): Point[] {
    const { width, height, minDistance, maxAttempts = 30, centerBias = 0 } = config;
    
    this.cellSize = minDistance / Math.sqrt(2);
    this.gridWidth = Math.ceil(width / this.cellSize);
    this.gridHeight = Math.ceil(height / this.cellSize);
    
    // Initialize grid
    this.grid = Array(this.gridHeight)
      .fill(null)
      .map(() => Array(this.gridWidth).fill(null));
    
    this.activeList = [];
    const points: Point[] = [];

    // Add first point
    const firstPoint = this.generateRandomPoint(width, height, centerBias);
    this.addPoint(firstPoint, points);

    while (this.activeList.length > 0) {
      const randomIndex = this.rng.nextInt(0, this.activeList.length);
      const point = this.activeList[randomIndex];
      let found = false;

      for (let i = 0; i < maxAttempts; i++) {
        const newPoint = this.generateRandomPointAround(point, minDistance, width, height, centerBias);
        
        if (this.isValidPoint(newPoint, minDistance, width, height)) {
          this.addPoint(newPoint, points);
          found = true;
          break;
        }
      }

      if (!found) {
        this.activeList.splice(randomIndex, 1);
      }
    }

    return points;
  }

  private generateRandomPoint(width: number, height: number, centerBias: number): Point {
    if (centerBias > 0 && this.rng.next() < centerBias) {
      // Generate point near center
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.3;
      const point = this.rng.pointInCircle(radius);
      return {
        x: Math.round(centerX + point.x),
        y: Math.round(centerY + point.y),
      };
    }
    
    return {
      x: Math.round(this.rng.nextFloat(0, width)),
      y: Math.round(this.rng.nextFloat(0, height)),
    };
  }

  private generateRandomPointAround(point: Point, minDistance: number, width: number, height: number, centerBias: number): Point {
    const angle = this.rng.nextFloat(0, Math.PI * 2);
    const radius = this.rng.nextFloat(minDistance, minDistance * 2);
    
    let x = point.x + Math.cos(angle) * radius;
    let y = point.y + Math.sin(angle) * radius;
    
    // Apply center bias
    if (centerBias > 0 && this.rng.next() < centerBias * 0.5) {
      const centerX = width / 2;
      const centerY = height / 2;
      const biasStrength = 0.1;
      x += (centerX - x) * biasStrength;
      y += (centerY - y) * biasStrength;
    }
    
    return {
      x: Math.round(Math.max(0, Math.min(width - 1, x))),
      y: Math.round(Math.max(0, Math.min(height - 1, y))),
    };
  }

  private isValidPoint(point: Point, minDistance: number, width: number, height: number): boolean {
    if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) {
      return false;
    }

    const gridX = Math.floor(point.x / this.cellSize);
    const gridY = Math.floor(point.y / this.cellSize);
    
    const startX = Math.max(0, gridX - 2);
    const endX = Math.min(this.gridWidth - 1, gridX + 2);
    const startY = Math.max(0, gridY - 2);
    const endY = Math.min(this.gridHeight - 1, gridY + 2);

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const existingPoint = this.grid[y][x];
        if (existingPoint) {
          const distance = Math.sqrt(
            (point.x - existingPoint.x) ** 2 + (point.y - existingPoint.y) ** 2
          );
          if (distance < minDistance) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private addPoint(point: Point, points: Point[]): void {
    points.push(point);
    this.activeList.push(point);
    
    const gridX = Math.floor(point.x / this.cellSize);
    const gridY = Math.floor(point.y / this.cellSize);
    this.grid[gridY][gridX] = point;
  }
}

/**
 * Generate Poisson-disk sampled points
 */
export function generatePoissonPoints(
  rng: Mulberry32,
  config: PoissonConfig
): Point[] {
  const sampler = new PoissonSampler(rng);
  return sampler.sample(config);
}

/**
 * Calculate density-based point count
 */
export function calculatePointCount(
  width: number,
  height: number,
  densityPerK: number
): number {
  const area = width * height;
  return Math.round((densityPerK * area) / 1000);
}
