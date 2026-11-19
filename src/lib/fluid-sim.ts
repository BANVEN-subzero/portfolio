import * as THREE from "three";

/**
 * Classic GPU fluid solver (curl -> vorticity -> divergence -> pressure ->
 * gradient subtract -> advect velocity -> advect dye), ping-pong half-float
 * render targets, driven through three.js fullscreen passes.
 *
 * Config per brief: sim 256, dye 512, velocity dissipation 0.98,
 * density dissipation 0.97, pressure dissipation 0.95, 5 pressure
 * iterations, curl 30, dt 1/60.
 */

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SPLAT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTarget;
uniform float uAspect;
uniform vec3 uColor;
uniform vec2 uPoint;
uniform float uRadius;
void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  vec3 base = texture2D(uTarget, vUv).xyz;
  gl_FragColor = vec4(base + splat, 1.0);
}
`;

const CLEAR_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uValue;
void main() {
  gl_FragColor = texture2D(uTexture, vUv) * uValue;
}
`;

const CURL_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
  float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).x;
  float vorticity = R - L - T + B;
  gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}
`;

const VORTICITY_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 texelSize;
uniform float uCurlStrength;
uniform float uDt;
void main() {
  float L = texture2D(uCurl, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, texelSize.y)).x;
  float C = texture2D(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;
  force.y *= -1.0;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * uDt;
  velocity = clamp(velocity, vec2(-1000.0), vec2(1000.0));
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const DIVERGENCE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
  float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
  float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
  vec2 C = texture2D(uVelocity, vUv).xy;
  if (vUv.x < texelSize.x) L = -C.x;
  if (vUv.x > 1.0 - texelSize.x) R = -C.x;
  if (vUv.y < texelSize.y) B = -C.y;
  if (vUv.y > 1.0 - texelSize.y) T = -C.y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const PRESSURE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;
void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_SUBTRACT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;
void main() {
  float L = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const ADVECT_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float uDt;
uniform float uDissipation;
void main() {
  vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * texelSize;
  vec4 result = texture2D(uSource, coord);
  gl_FragColor = result * uDissipation;
}
`;

interface PingPong {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
  swap(): void;
}

function makePingPong(w: number, h: number): PingPong {
  const opts: THREE.RenderTargetOptions = {
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
  };
  const a = new THREE.WebGLRenderTarget(w, h, opts);
  const b = new THREE.WebGLRenderTarget(w, h, opts);
  return {
    read: a,
    write: b,
    swap() {
      const t = this.read;
      this.read = this.write;
      this.write = t;
    },
  };
}

export class FluidSim {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.Camera();
  private quad: THREE.Mesh;

  private simRes: number;
  private dyeRes: number;

  private velocity!: PingPong;
  private dye!: PingPong;
  private pressure!: PingPong;
  private curlTarget!: THREE.WebGLRenderTarget;
  private divergenceTarget!: THREE.WebGLRenderTarget;

  private splatMat!: THREE.ShaderMaterial;
  private clearMat!: THREE.ShaderMaterial;
  private curlMat!: THREE.ShaderMaterial;
  private vorticityMat!: THREE.ShaderMaterial;
  private divergenceMat!: THREE.ShaderMaterial;
  private pressureMat!: THREE.ShaderMaterial;
  private gradientMat!: THREE.ShaderMaterial;
  private advectMat!: THREE.ShaderMaterial;

  private materials: THREE.ShaderMaterial[] = [];
  private targets: THREE.WebGLRenderTarget[] = [];
  private geometry: THREE.PlaneGeometry;

  constructor(renderer: THREE.WebGLRenderer, simRes = 256, dyeRes = 512) {
    this.renderer = renderer;
    this.simRes = simRes;
    this.dyeRes = dyeRes;

    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(this.geometry, new THREE.MeshBasicMaterial());
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    this.build();
  }

  private build() {
    const r = this.renderer;
    const simTexel = new THREE.Vector2(1 / this.simRes, 1 / this.simRes);
    const dyeTexel = new THREE.Vector2(1 / this.dyeRes, 1 / this.dyeRes);

    const mk = (frag: string, uniforms: Record<string, THREE.IUniform>) => {
      const m = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: frag,
        uniforms,
        depthTest: false,
        depthWrite: false,
      });
      this.materials.push(m);
      return m;
    };

    this.velocity = makePingPong(this.simRes, this.simRes);
    this.dye = makePingPong(this.dyeRes, this.dyeRes);
    this.pressure = makePingPong(this.simRes, this.simRes);
    this.curlTarget = new THREE.WebGLRenderTarget(this.simRes, this.simRes, {
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.divergenceTarget = new THREE.WebGLRenderTarget(
      this.simRes,
      this.simRes,
      {
        format: THREE.RGBAFormat,
        type: THREE.HalfFloatType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
      }
    );

    this.targets.push(
      this.velocity.read,
      this.velocity.write,
      this.dye.read,
      this.dye.write,
      this.pressure.read,
      this.pressure.write,
      this.curlTarget,
      this.divergenceTarget
    );

    this.splatMat = mk(SPLAT_FRAG, {
      uTarget: { value: null },
      uAspect: { value: 1 },
      uColor: { value: new THREE.Vector3() },
      uPoint: { value: new THREE.Vector2() },
      uRadius: { value: 0.001 },
    });

    this.clearMat = mk(CLEAR_FRAG, {
      uTexture: { value: null },
      uValue: { value: 0.95 },
    });

    this.curlMat = mk(CURL_FRAG, {
      uVelocity: { value: null },
      texelSize: { value: simTexel.clone() },
    });

    this.vorticityMat = mk(VORTICITY_FRAG, {
      uVelocity: { value: null },
      uCurl: { value: null },
      texelSize: { value: simTexel.clone() },
      uCurlStrength: { value: 30 },
      uDt: { value: 1 / 60 },
    });

    this.divergenceMat = mk(DIVERGENCE_FRAG, {
      uVelocity: { value: null },
      texelSize: { value: simTexel.clone() },
    });

    this.pressureMat = mk(PRESSURE_FRAG, {
      uPressure: { value: null },
      uDivergence: { value: null },
      texelSize: { value: simTexel.clone() },
    });

    this.gradientMat = mk(GRADIENT_SUBTRACT_FRAG, {
      uPressure: { value: null },
      uVelocity: { value: null },
      texelSize: { value: simTexel.clone() },
    });

    this.advectMat = mk(ADVECT_FRAG, {
      uVelocity: { value: null },
      uSource: { value: null },
      texelSize: { value: simTexel.clone() },
      uDt: { value: 1 / 60 },
      uDissipation: { value: 0.98 },
    });

    void dyeTexel;

    // Explicitly clear every target so nothing samples garbage.
    const prevClear = r.autoClear;
    r.autoClear = true;
    r.setClearColor(0x000000, 1);
    for (const t of this.targets) {
      r.setRenderTarget(t);
      r.clear();
    }
    r.setRenderTarget(null);
    r.autoClear = prevClear;
  }

  get velocityTexture(): THREE.Texture {
    return this.velocity.read.texture;
  }

  get dyeTexture(): THREE.Texture {
    return this.dye.read.texture;
  }

  /**
   * Additive splat. u/v are UV coordinates (v measured from the bottom),
   * dx/dy the velocity to inject (sim units), sigma the gaussian sigma in
   * "height-normalised" UV units.
   */
  splat(u: number, v: number, dx: number, dy: number, sigma: number) {
    const radius = Math.max(sigma * sigma, 1e-6);
    const aspect = this.renderer.getSize(new THREE.Vector2()).x /
      Math.max(1, this.renderer.getSize(new THREE.Vector2()).y);

    // velocity
    this.splatMat.uniforms.uTarget.value = this.velocity.read.texture;
    this.splatMat.uniforms.uAspect.value = aspect;
    (this.splatMat.uniforms.uColor.value as THREE.Vector3).set(dx, dy, 1);
    (this.splatMat.uniforms.uPoint.value as THREE.Vector2).set(u, v);
    this.splatMat.uniforms.uRadius.value = radius;
    this.pass(this.splatMat, this.velocity.write);
    this.velocity.swap();

    // dye (white)
    this.splatMat.uniforms.uTarget.value = this.dye.read.texture;
    (this.splatMat.uniforms.uColor.value as THREE.Vector3).set(1, 1, 1);
    this.pass(this.splatMat, this.dye.write);
    this.dye.swap();
  }

  step(dt: number) {
    // curl
    this.curlMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.curlMat, this.curlTarget);

    // vorticity
    this.vorticityMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.vorticityMat.uniforms.uCurl.value = this.curlTarget.texture;
    this.vorticityMat.uniforms.uDt.value = dt;
    this.pass(this.vorticityMat, this.velocity.write);
    this.velocity.swap();

    // divergence
    this.divergenceMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.divergenceMat, this.divergenceTarget);

    // pressure decay + jacobi iterations
    this.clearMat.uniforms.uTexture.value = this.pressure.read.texture;
    this.clearMat.uniforms.uValue.value = 0.95;
    this.pass(this.clearMat, this.pressure.write);
    this.pressure.swap();

    this.pressureMat.uniforms.uDivergence.value =
      this.divergenceTarget.texture;
    for (let i = 0; i < 5; i++) {
      this.pressureMat.uniforms.uPressure.value = this.pressure.read.texture;
      this.pass(this.pressureMat, this.pressure.write);
      this.pressure.swap();
    }

    // gradient subtract
    this.gradientMat.uniforms.uPressure.value = this.pressure.read.texture;
    this.gradientMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.pass(this.gradientMat, this.velocity.write);
    this.velocity.swap();

    // advect velocity
    this.advectMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectMat.uniforms.uSource.value = this.velocity.read.texture;
    this.advectMat.uniforms.uDt.value = dt;
    this.advectMat.uniforms.uDissipation.value = 0.98;
    this.pass(this.advectMat, this.velocity.write);
    this.velocity.swap();

    // advect dye
    this.advectMat.uniforms.uVelocity.value = this.velocity.read.texture;
    this.advectMat.uniforms.uSource.value = this.dye.read.texture;
    this.advectMat.uniforms.uDissipation.value = 0.97;
    this.pass(this.advectMat, this.dye.write);
    this.dye.swap();
  }

  private pass(mat: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const t of this.targets) t.dispose();
    for (const m of this.materials) m.dispose();
    this.geometry.dispose();
    (this.quad.material as THREE.Material).dispose();
  }
}
