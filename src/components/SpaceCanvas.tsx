'use client';

import { useEffect, useRef } from 'react';
import { 
  Application, 
  Container, 
  ParticleContainer, 
  Sprite, 
  Graphics, 
  Texture, 
  RenderTexture, 
  TilingSprite, 
  Matrix
} from 'pixi.js';
import { createRandom, DEFAULT_SEED } from '@/lib/random';
import { generatePoissonPoints, calculatePointCount } from '@/lib/poisson';
import {
  SPACE_PALETTE,
  createDotTexture,
  createSparkleTexture,
  createNoiseTexture,
  createNebulaPatch,
  generateStarConfig,
  generateSparkleConfig,
  getDepthBrightness,
} from '@/lib/space-paint';
import { createPostFilter } from '@/filters/PostFilter';

interface SpaceCanvasProps {
  seed?: number;
}

// Utility functions
function setNearest(tex: Texture | RenderTexture) {
  tex.baseTexture.setStyle({ scaleMode: 'nearest' });
  return tex;
}

function snap(n: number) {
  return Math.round(n);
}

function clearLayer(layer: Container | ParticleContainer) {
  layer.removeChildren().forEach(c => c.destroy({ children: true, texture: true, baseTexture: true }));
}

function rafDebounce(fn: () => void, delay = 150) {
  let t: number | undefined, r: number | undefined;
  return () => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => {
      if (r) cancelAnimationFrame(r);
      r = requestAnimationFrame(fn);
    }, delay);
  };
}

function safeDestroy(app?: Application | null) {
  if (!app || app.destroyed) return;
  try {
    if ((app as any).renderer) app.destroy(true);
    else app.destroy();
  } catch {}
}

export default function SpaceCanvas({ seed = DEFAULT_SEED }: SpaceCanvasProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const postFilterRef = useRef<any>(null);
  const resizeHandlerRef = useRef<() => void>();
  const layersRef = useRef<{ nebula: Container; sparkle: Container; small: ParticleContainer; micro: ParticleContainer } | null>(null);
  const initializedRef = useRef(false);

  // Ensure layers exist
  function ensureLayers(app: Application) {
    if (layersRef.current) return layersRef.current;
    const nebula = new Container();
    const sparkle = new Container();
    const small = new ParticleContainer(20000, { tint: true, alpha: true, scale: true });
    const micro = new ParticleContainer(40000, { tint: true, alpha: true, scale: true });
    app.stage.addChild(nebula, sparkle, small, micro);
    layersRef.current = { nebula, sparkle, small, micro };
    return layersRef.current;
  }

  // Regenerate space content
  async function regenerate(app: Application) {
    if (app.destroyed) return;
    const { nebula, sparkle, small, micro } = ensureLayers(app);
    clearLayer(nebula); 
    clearLayer(sparkle); 
    clearLayer(small); 
    clearLayer(micro);

    const rng = createRandom(seed);
    const W = app.renderer.width;
    const H = app.renderer.height;

    // Create textures with nearest scaling
    const dot1 = setNearest(createDotTexture(app, 1));
    const dot2 = setNearest(createDotTexture(app, 2));
    const sparkleTex = setNearest(createSparkleTexture(app));
    const noiseTex = setNearest(createNoiseTexture(app, 64));

    // L1: Micro stars (background)
    const countMicro = calculatePointCount(W, H, 2.8);
    const microPoints = generatePoissonPoints(rng, {
      width: W,
      height: H,
      minDistance: 8,
      centerBias: 0.5,
    });
    
    for (const point of microPoints) {
      const config = generateStarConfig(rng, 'micro', SPACE_PALETTE);
      const s = new Sprite(dot1);
      s.x = snap(point.x);
      s.y = snap(point.y);
      s.anchor.set(0.5);
      s.scale.set(config.size);
      s.tint = config.color;
      s.alpha = config.alpha;
      micro.addChild(s);
    }

    // L2: Small stars
    const countSmall = calculatePointCount(W, H, 1.2);
    const smallPoints = generatePoissonPoints(rng, {
      width: W,
      height: H,
      minDistance: 12,
      centerBias: 0.5,
    });
    
    for (const point of smallPoints) {
      const config = generateStarConfig(rng, 'small', SPACE_PALETTE);
      const s = new Sprite(dot2);
      s.x = snap(point.x);
      s.y = snap(point.y);
      s.anchor.set(0.5);
      s.scale.set(config.size);
      s.tint = config.color;
      s.alpha = config.alpha;
      small.addChild(s);
    }

    // L3: Sparkles
    const countSparkle = Math.max(10, Math.min(40, Math.round((W * H) / 60000)));
    const sparklePoints = generatePoissonPoints(rng, {
      width: W,
      height: H,
      minDistance: 20,
      centerBias: 0.3,
    });
    
    for (const point of sparklePoints) {
      const config = generateSparkleConfig(rng, SPACE_PALETTE);
      const sparkle = new Sprite(sparkleTex);
      sparkle.x = snap(point.x);
      sparkle.y = snap(point.y);
      sparkle.anchor.set(0.5);
      sparkle.scale.set(config.size);
      sparkle.tint = config.color;
      sparkle.alpha = config.alpha;
      sparkle.blendMode = 'add' as any;
      
      sparkle.addChild(sparkle);
    }

    // L4: Nebula patches
    const nebulaCount = Math.max(2, Math.min(8, Math.round((W * H) / 200000)));
    const nebulaPoints = generatePoissonPoints(rng, {
      width: W,
      height: H,
      minDistance: 80,
      centerBias: 0.2,
    });
    
    for (const point of nebulaPoints) {
      const radius = rng.nextFloat(0.28, 0.35) * Math.min(W, H);
      const patch = createNebulaPatch(app, snap(point.x), snap(point.y), radius, rng);
      if (patch) {
        nebula.addChild(patch);
      }
    }

    // L5: Background noise
    const noise = new TilingSprite(noiseTex, W, H);
    noise.alpha = 0.07;
    noise.blendMode = 'screen' as any;
    nebula.addChild(noise);

    // Render once
    app.render();
  }

  // Single initialization with StrictMode protection
  useEffect(() => {
    // Prevent re-initialization (StrictMode/Fast Refresh guard)
    if (appRef.current) return;

    const app = new Application();
    appRef.current = app;
    let aborted = false;

    (async () => {
      try {
        await app.init({ 
          background: 0x0a0f1e, 
          antialias: false, 
          resolution: 1, 
          autoDensity: true, 
          resizeTo: window 
        });
        
        if (aborted) { 
          safeDestroy(app); 
          return; 
        }

        app.renderer.roundPixels = true;

        // Remove existing canvas and attach new one
        if (rootRef.current) {
          const prev = rootRef.current.querySelector('canvas');
          if (prev && prev !== app.canvas) prev.remove();
          if (app.canvas.parentNode !== rootRef.current) rootRef.current.appendChild(app.canvas);
        }

        // Create post-processing filter once and reuse
        const post = postFilterRef.current ?? (postFilterRef.current = createPostFilter());
        app.stage.filters = [post];

        await regenerate(app);
        post.update({ x: app.renderer.width, y: app.renderer.height });
        app.ticker.stop();
        initializedRef.current = true;

        const onResize = rafDebounce(() => {
          if (aborted || !appRef.current || app.destroyed) return;
          try {
            post.update({ x: app.renderer.width, y: app.renderer.height });
            regenerate(app);
          } catch {}
        }, 150);
        resizeHandlerRef.current = onResize;
        window.addEventListener('resize', onResize);
      } catch {}
    })();

    return () => {
      aborted = true;
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
        resizeHandlerRef.current = undefined;
      }
      const a = appRef.current;
      appRef.current = null;
      layersRef.current = null;
      safeDestroy(a);
    };
  }, []);

  return <div ref={rootRef} className="fixed inset-0" aria-hidden="true" />;
}