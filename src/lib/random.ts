/**
 * Mulberry32 PRNG implementation for deterministic random generation
 * Based on seed for reproducible results
 */
export class Mulberry32 {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min (inclusive) and max (exclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min)) + min;
  }

  /**
   * Generate random float between min (inclusive) and max (exclusive)
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Generate random boolean
   */
  nextBoolean(): boolean {
    return this.next() < 0.5;
  }

  /**
   * Choose random element from array
   */
  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length)];
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate random point within circle
   */
  pointInCircle(radius: number): { x: number; y: number } {
    const angle = this.nextFloat(0, Math.PI * 2);
    const r = Math.sqrt(this.next()) * radius;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
    };
  }

  /**
   * Generate random point within rectangle
   */
  pointInRect(width: number, height: number): { x: number; y: number } {
    return {
      x: this.nextFloat(0, width),
      y: this.nextFloat(0, height),
    };
  }
}

/**
 * Create new PRNG instance with seed
 */
export function createRandom(seed: number): Mulberry32 {
  return new Mulberry32(seed);
}

/**
 * Default seed for space generation
 */
export const DEFAULT_SEED = 1337;
