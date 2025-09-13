import * as PIXI from 'pixi.js';
import { Mulberry32 } from './random';

/**
 * Space color palette for consistent pixel art styling
 */
export const SPACE_PALETTE = [
  0xf8f8ff, // #f8f8ff - Ghost White
  0xe6f1ff, // #e6f1ff - Light Blue
  0xaecdff, // #aecdff - Soft Blue
  0x9fb0c7, // #9fb0c7 - Gray Blue
  0xb9a3ff, // #b9a3ff - Lavender
  0x7fd6ff, // #7fd6ff - Cyan
] as const;

export interface StarConfig {
  size: number;
  color: number;
  alpha: number;
}

export interface SparkleConfig {
  size: number;
  color: number;
  alpha: number;
  coreSize: number;
}

/**
 * Create a simple dot texture for stars
 */
export function createDotTexture(app: PIXI.Application, size: number = 1): PIXI.RenderTexture {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xffffff);
  graphics.drawRect(0, 0, size, size);
  graphics.endFill();
  
  const rt = app.renderer.generateTexture(graphics, {
    scaleMode: 'nearest',
    resolution: 1,
  });
  
  graphics.destroy();
  return rt;
}

/**
 * Create a cross-shaped sparkle texture
 */
export function createSparkleTexture(app: PIXI.Application, size: number = 5): PIXI.RenderTexture {
  const graphics = new PIXI.Graphics();
  const halfSize = Math.floor(size / 2);
  
  // Draw cross shape
  graphics.lineStyle(1, 0xffffff, 0.3);
  
  // Horizontal line
  graphics.moveTo(0, halfSize);
  graphics.lineTo(size, halfSize);
  
  // Vertical line
  graphics.moveTo(halfSize, 0);
  graphics.lineTo(halfSize, size);
  
  // Core dot
  graphics.beginFill(0xffffff, 1);
  graphics.drawRect(halfSize, halfSize, 1, 1);
  graphics.endFill();
  
  const rt = app.renderer.generateTexture(graphics, {
    scaleMode: 'nearest',
    resolution: 1,
  });
  
  graphics.destroy();
  return rt;
}

/**
 * Create noise texture for dithering effects
 */
export function createNoiseTexture(app: PIXI.Application, size: number = 64): PIXI.RenderTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const noise = Math.random() * 255;
    data[i] = noise;     // R
    data[i + 1] = noise; // G
    data[i + 2] = noise; // B
    data[i + 3] = 255;   // A
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  const rt = PIXI.RenderTexture.from(canvas, {
    scaleMode: 'nearest',
  });
  
  return rt;
}

/**
 * Create nebula gradient texture
 */
export function createNebulaTexture(app: PIXI.Application, size: number = 512): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size / 2;
  
  // Create radial gradient
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
  gradient.addColorStop(0, '#7b3fe4'); // Purple center
  gradient.addColorStop(0.7, '#c39bff'); // Light purple
  gradient.addColorStop(1, 'rgba(195, 155, 255, 0)'); // Transparent edge
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  return PIXI.Texture.from(canvas, {
    scaleMode: PIXI.SCALE_MODES.LINEAR,
  });
}

/**
 * Generate star configuration based on layer and random seed
 */
export function generateStarConfig(
  rng: Mulberry32,
  layer: 'micro' | 'small',
  palette: readonly number[]
): StarConfig {
  const isMicro = layer === 'micro';
  
  // Size based on layer
  const size = isMicro ? (rng.nextBoolean() ? 1 : 2) : rng.nextInt(1, 3);
  
  // Color selection with bias
  const isWhite = rng.nextFloat(0, 1) < (isMicro ? 0.8 : 0.6);
  const color = isWhite 
    ? palette[0] // Ghost White
    : rng.nextFloat(0, 1) < 0.7 
      ? palette[1] // Light Blue
      : palette[3]; // Gray Blue
  
  // Alpha based on layer
  const alpha = isMicro 
    ? rng.nextFloat(0.75, 1.0)
    : rng.nextFloat(0.5, 0.8);
  
  return { size, color, alpha };
}

/**
 * Generate sparkle configuration
 */
export function generateSparkleConfig(
  rng: Mulberry32,
  palette: readonly number[]
): SparkleConfig {
  const size = rng.nextInt(3, 6);
  const color = palette[rng.nextInt(0, palette.length)];
  const alpha = rng.nextFloat(0.2, 0.35);
  const coreSize = 1;
  
  return { size, color, alpha, coreSize };
}

/**
 * Create particle container for stars
 */
export function createStarContainer(app: PIXI.Application): PIXI.ParticleContainer {
  return new PIXI.ParticleContainer(1000, {
    scale: true,
    position: true,
    rotation: false,
    uvs: false,
    alpha: true,
    tint: true,
  });
}

/**
 * Add star to particle container
 */
export function addStarToContainer(
  container: PIXI.ParticleContainer,
  texture: PIXI.Texture,
  x: number,
  y: number,
  config: StarConfig
): void {
  const star = new PIXI.Sprite(texture);
  star.x = x;
  star.y = y;
  star.scale.set(config.size);
  star.tint = config.color;
  star.alpha = config.alpha;
  
  container.addChild(star);
}

/**
 * Create depth-based brightness multiplier
 */
export function getDepthBrightness(x: number, y: number, width: number, height: number): number {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  const normalizedDistance = distance / maxDistance;
  
  // Center is 0.9x brightness, edges are 1.1x brightness
  return 0.9 + (normalizedDistance * 0.2);
}

/**
 * Create nebula patch
 */
export function createNebulaPatch(
  app: PIXI.Application,
  x: number,
  y: number,
  radius: number,
  rng: Mulberry32
): PIXI.Container {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  
  // Create main nebula texture
  const nebulaTexture = createNebulaTexture(app, Math.round(radius * 2));
  const nebula = new PIXI.Sprite(nebulaTexture);
  nebula.anchor.set(0.5);
  nebula.scale.set(radius / 256); // Scale to desired radius
  nebula.alpha = rng.nextFloat(0.03, 0.08);
  container.addChild(nebula);
  
  // Add noise overlay
  const noiseTexture = createNoiseTexture(app, 64);
  const noise = new PIXI.TilingSprite(noiseTexture, radius * 2, radius * 2);
  noise.anchor.set(0.5);
  noise.alpha = rng.nextFloat(0.06, 0.1);
  noise.blendMode = PIXI.BLEND_MODES.SCREEN;
  container.addChild(noise);
  
  // Add ribbon streaks
  const streakCount = rng.nextInt(2, 5);
  for (let i = 0; i < streakCount; i++) {
    const streak = createRibbonStreak(radius, rng);
    container.addChild(streak);
  }
  
  return container;
}

/**
 * Create ribbon streak for nebula
 */
function createRibbonStreak(radius: number, rng: Mulberry32): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  const width = rng.nextInt(6, 15);
  const length = rng.nextFloat(radius * 0.5, radius * 1.5);
  const angle = rng.nextFloat(0, Math.PI * 2);
  
  graphics.lineStyle(width, 0xc39bff, rng.nextFloat(0.05, 0.1));
  graphics.moveTo(0, 0);
  graphics.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
  graphics.blendMode = 'screen';
  
  return graphics;
}
