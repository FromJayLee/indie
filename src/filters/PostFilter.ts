import * as PIXI from 'pixi.js';

/**
 * Post-processing filter for pixel art space background
 * Includes: Ordered dithering, vignette, contrast/saturation/gamma correction, channel shift
 */
export class PostFilter extends PIXI.Filter {
  constructor() {
    const vertexShader = `
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat3 projectionMatrix;
      
      varying vec2 vTextureCoord;
      
      void main(void) {
        gl_Position = vec4((projectionMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        vTextureCoord = aTextureCoord;
      }
    `;

    const fragmentShader = `
      precision mediump float;
      
      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform float time;
      uniform vec2 resolution;
      
      // 4x4 Bayer matrix for ordered dithering
      const mat4 bayerMatrix = mat4(
        0.0, 8.0, 2.0, 10.0,
        12.0, 4.0, 14.0, 6.0,
        3.0, 11.0, 1.0, 9.0,
        15.0, 7.0, 13.0, 5.0
      );
      
      // Dithering function
      float dither(vec2 coord, float intensity) {
        vec2 bayerCoord = mod(coord * resolution / 4.0, 4.0);
        int x = int(bayerCoord.x);
        int y = int(bayerCoord.y);
        
        float threshold = bayerMatrix[y][x] / 16.0;
        return step(threshold, intensity);
      }
      
      // Vignette function
      float vignette(vec2 coord, float radius) {
        vec2 center = vec2(0.5, 0.5);
        float distance = length(coord - center);
        return smoothstep(radius, radius - 0.1, distance);
      }
      
      // Channel shift function
      vec3 channelShift(vec3 color, vec2 coord, float intensity) {
        vec2 shift = intensity * vec2(0.25, 0.25);
        
        float r = texture2D(uSampler, coord + shift).r;
        float g = texture2D(uSampler, coord).g;
        float b = texture2D(uSampler, coord - shift).b;
        
        return vec3(r, g, b);
      }
      
      void main(void) {
        vec2 coord = vTextureCoord;
        vec4 originalColor = texture2D(uSampler, coord);
        
        // Apply channel shift first
        vec3 shiftedColor = channelShift(originalColor.rgb, coord, 0.25);
        
        // Apply vignette
        float vignetteFactor = vignette(coord, 0.85);
        shiftedColor *= vignetteFactor;
        
        // Apply contrast adjustment (+8%)
        shiftedColor = (shiftedColor - 0.5) * 1.08 + 0.5;
        
        // Apply saturation adjustment (+6%)
        float luminance = dot(shiftedColor, vec3(0.299, 0.587, 0.114));
        shiftedColor = mix(vec3(luminance), shiftedColor, 1.06);
        
        // Apply gamma correction (0.98-1.02 range, using 1.0)
        shiftedColor = pow(shiftedColor, vec3(1.0));
        
        // Apply ordered dithering
        float ditherIntensity = 0.08; // 8% dithering
        shiftedColor.r = dither(coord, shiftedColor.r) * ditherIntensity + shiftedColor.r * (1.0 - ditherIntensity);
        shiftedColor.g = dither(coord, shiftedColor.g) * ditherIntensity + shiftedColor.g * (1.0 - ditherIntensity);
        shiftedColor.b = dither(coord, shiftedColor.b) * ditherIntensity + shiftedColor.b * (1.0 - ditherIntensity);
        
        gl_FragColor = vec4(shiftedColor, originalColor.a);
      }
    `;

    super(vertexShader, fragmentShader, {
      time: 0.0,
      resolution: { x: 1.0, y: 1.0 },
    });
  }

  /**
   * Update filter uniforms
   */
  update(resolution: { x: number; y: number }): void {
    this.uniforms.resolution = resolution;
  }
}

/**
 * Create post-processing filter instance
 */
export function createPostFilter(): PostFilter {
  return new PostFilter();
}
