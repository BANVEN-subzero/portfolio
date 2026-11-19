"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FluidSim } from "@/lib/fluid-sim";

/**
 * AXON-style particle field: a sculpted SDF ring form held by ~262k points on
 * desktop (128x128 grid = 16,384 on mobile), ping-pong float position
 * texture, curl-noise agitation, fluid-driven cursor stirring, gaze camera.
 */

const SIM_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const SIM_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uPositions;
uniform sampler2D uOrigins;
uniform sampler2D uFluidVel;
uniform sampler2D uFluidDye;
uniform float uTime;
uniform float uHZ;
uniform mat4 uProjView;
uniform mat4 uModel;
uniform mat3 uCamRot;

// analytic curl of three sine-sum potentials, softly normalised
vec3 curlNoise(vec3 p) {
  float u1 = 1.1 * p.x + 0.8 * p.y + 0.6 * p.z;
  float u2 = 2.3 * p.x - 1.1 * p.y + 1.4 * p.z + 1.7;
  float u3 = 0.9 * p.x + 1.2 * p.y + 0.7 * p.z + 3.1;
  float u4 = 1.5 * p.x + 2.0 * p.y - 0.8 * p.z + 4.2;
  float u5 = 0.7 * p.x + 1.0 * p.y + 1.3 * p.z + 5.0;
  float u6 = 1.9 * p.x + 0.6 * p.y + 2.2 * p.z + 2.6;
  float c1 = cos(u1), c2 = cos(u2), c3 = cos(u3);
  float c4 = cos(u4), c5 = cos(u5), c6 = cos(u6);
  float dAy = 0.8 * c1 - 0.55 * c2;
  float dAz = 0.6 * c1 + 0.7 * c2;
  float dBx = 0.9 * c3 + 0.75 * c4;
  float dBz = 0.7 * c3 - 0.4 * c4;
  float dCx = 0.7 * c5 + 0.95 * c6;
  float dCy = 1.0 * c5 + 0.3 * c6;
  vec3 curl = vec3(dCy - dBz, dAz - dCx, dBx - dAy);
  return curl / (length(curl) + 1e-4);
}

// sculpted form: bent, hollow, slightly twisted ring with one large opening
float sdfShape(vec3 p) {
  float r = length(p);
  if (r > 0.8) return r - 0.7;
  p = vec3(p.y, p.z, p.x); // quat (0.5, 0.5, 0.5, 0.5)
  p.z = sqrt(p.z * p.z + 0.0215) - sqrt(0.012); // soft depth mirror
  float an = atan(p.y, p.x);
  float R = 0.40 + 0.05 * sin(an * 3.0 + 1.7); // softer lobes
  vec2 q = vec2(length(p.xy) - R, p.z + 0.03 * sin(an * 3.0)); // gentle bend
  float tr = 0.16 + 0.025 * sin(an * 2.0 + 0.5);
  float d = length(q) - tr;
  vec3 o = vec3(0.0, 0.45, 0.02);
  d = max(d, 0.26 - length(p - o)); // one large opening
  return d;
}

vec3 sdfNormal(vec3 p) {
  float e = 0.001;
  float dx = sdfShape(p + vec3(e, 0.0, 0.0)) - sdfShape(p - vec3(e, 0.0, 0.0));
  float dy = sdfShape(p + vec3(0.0, e, 0.0)) - sdfShape(p - vec3(0.0, e, 0.0));
  float dz = sdfShape(p + vec3(0.0, 0.0, e)) - sdfShape(p - vec3(0.0, 0.0, e));
  return vec3(dx, dy, dz) / (2.0 * e);
}

void main() {
  vec3 pos = texture2D(uPositions, vUv).xyz;
  vec3 origin = texture2D(uOrigins, vUv).xyz;

  if (length(pos) > 0.7) pos *= 0.5;

  pos += curlNoise(pos * 0.1 + uTime * 0.05) * 0.0002 * uHZ;

  vec3 gradient = sdfNormal(pos);
  float sdf = sdfShape(pos);
  vec3 npos = pos / (length(pos) + 1e-4);
  vec3 ngrad = gradient / (length(gradient) + 1e-4);
  pos += cross(npos, ngrad) * 0.0005; // swirl along the surface
  pos += -gradient * sdf * 0.5; // pull onto the surface
  pos += (origin - pos) * 0.0002 * uHZ; // spring back to origin

  // mouse fluid
  vec4 clip = uProjView * uModel * vec4(pos, 1.0);
  vec2 screenUV = (clip.xyz / clip.w).xy * 0.5 + 0.5;
  vec3 flow = uCamRot * vec3(texture2D(uFluidVel, screenUV).xy, 0.0);
  pos += flow * 0.0001 * uHZ * 0.4 * texture2D(uFluidDye, screenUV).r;

  gl_FragColor = vec4(pos, 1.0);
}
`;

const POINTS_VERT = /* glsl */ `
attribute vec4 random;
uniform sampler2D uPositions;
uniform float uDPR;
varying vec4 vRandom;
varying float vScale;
void main() {
  vRandom = random;
  vec3 pos = texture2D(uPositions, position.xy).xyz;
  pos *= mix(1.0, 1.5, pow(random.y, 150.0));
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  float dist = length(mv.xyz);
  float scale = smoothstep(3.0, 15.0, dist) * mix(0.5, 1.0, random.z);
  vScale = scale;
  gl_PointSize = 0.04 * uDPR * 2.0 * scale * (1000.0 / dist);
  gl_Position = projectionMatrix * mv;
}
`;

const POINTS_FRAG = /* glsl */ `
uniform sampler2D uMatcap;
uniform float uTime;
varying vec4 vRandom;
varying float vScale;

float softLight1(float b, float s) {
  if (s <= 0.5) return b - (1.0 - 2.0 * s) * b * (1.0 - b);
  float d = b <= 0.25 ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);
  return b + (2.0 * s - 1.0) * (d - b);
}
float overlay1(float b, float s) {
  return b < 0.5 ? (2.0 * b * s) : (1.0 - 2.0 * (1.0 - b) * (1.0 - s));
}

void main() {
  if (vScale < 0.1) discard;
  vec2 c = gl_PointCoord - 0.5;
  if (dot(c, c) > 0.25) discard;

  vec3 col = vec3(mix(0.0, 0.2, vRandom.x));
  col = mix(col, vec3(0.6, 0.45, 1.0), pow(vRandom.z, 100.0)); // sparse lavender
  col *= 0.5 + (0.4 + sin(uTime * 4.0 + vRandom.y * 20.0)) * pow(vRandom.z, 10.0) * 2.5; // sparkle

  float rot = sin(uTime + vRandom.z * 20.0) * 0.5 + 1.0;
  vec2 rc = vec2(c.x * cos(rot) - c.y * sin(rot), c.x * sin(rot) + c.y * cos(rot));
  vec3 mat = texture2D(uMatcap, rc + 0.5).rgb;

  vec3 soft = vec3(softLight1(col.r, mat.r), softLight1(col.g, mat.g), softLight1(col.b, mat.b));
  col = mix(col, soft, 0.8);
  vec3 over = vec3(overlay1(col.r, mat.r), overlay1(col.g, mat.g), overlay1(col.b, mat.b));
  col = mix(col, over, 0.2);

  gl_FragColor = vec4(col, 1.0);
}
`;

function makeMatcapTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(26, 26, 2, 32, 32, 30);
    g.addColorStop(0, "#f2f2f2");
    g.addColorStop(0.35, "#b0b0b0");
    g.addColorStop(0.7, "#585858");
    g.addColorStop(1, "#101010");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  return t;
}

const mapRange = (
  v: number,
  a: number,
  b: number,
  c: number,
  d: number
): number => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return c + (d - c) * t;
};

export default function Field() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isMobile = window.innerWidth < 768;
    const SIZE = isMobile ? 128 : 512;
    const COUNT = SIZE * SIZE;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.id = "bg";
    host.appendChild(renderer.domElement);

    const gl = renderer.getContext();
    gl.getExtension("EXT_color_buffer_float");

    // --- scene, camera, group ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const camBase = new THREE.Vector3(-1.17, 0, 6);
    camera.position.copy(camBase);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    group.position.set(0.343, 0.16, -1);
    group.rotation.set(
      THREE.MathUtils.degToRad(-28.4),
      THREE.MathUtils.degToRad(390),
      THREE.MathUtils.degToRad(4.92)
    );
    group.scale.set(5, 5, 6);
    scene.add(group);

    // --- origins + ping-pong float targets ---
    const originData = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      originData[i * 4] = Math.random() * 2 - 1;
      originData[i * 4 + 1] = Math.random() * 2 - 1;
      originData[i * 4 + 2] = Math.random() * 2 - 1;
      originData[i * 4 + 3] = 1;
    }
    const originTex = new THREE.DataTexture(
      originData,
      SIZE,
      SIZE,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    originTex.needsUpdate = true;

    const rtOpts: THREE.RenderTargetOptions = {
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
    };
    const posA = new THREE.WebGLRenderTarget(SIZE, SIZE, rtOpts);
    const posB = new THREE.WebGLRenderTarget(SIZE, SIZE, rtOpts);
    let current = posA;
    let next = posB;

    // --- fluid ---
    const fluid = new FluidSim(renderer, 256, 512);

    // --- particle simulation pass ---
    const quadScene = new THREE.Scene();
    const quadCam = new THREE.Camera();
    const quadGeo = new THREE.PlaneGeometry(2, 2);
    const simMat = new THREE.ShaderMaterial({
      vertexShader: SIM_VERT,
      fragmentShader: SIM_FRAG,
      uniforms: {
        uPositions: { value: null },
        uOrigins: { value: originTex },
        uFluidVel: { value: fluid.velocityTexture },
        uFluidDye: { value: fluid.dyeTexture },
        uTime: { value: 0 },
        uHZ: { value: 1 },
        uProjView: { value: new THREE.Matrix4() },
        uModel: { value: new THREE.Matrix4() },
        uCamRot: { value: new THREE.Matrix3() },
      },
      depthTest: false,
      depthWrite: false,
    });
    const simQuad = new THREE.Mesh(quadGeo, simMat);
    simQuad.frustumCulled = false;
    quadScene.add(simQuad);

    // --- points geometry ---
    const geo = new THREE.BufferGeometry();
    const posArr = new Float32Array(COUNT * 3);
    const randArr = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      const x = i % SIZE;
      const y = Math.floor(i / SIZE);
      posArr[i * 3] = (x + 0.5) / SIZE;
      posArr[i * 3 + 1] = (y + 0.5) / SIZE;
      posArr[i * 3 + 2] = 0;
      randArr[i * 4] = Math.random();
      randArr[i * 4 + 1] = Math.random();
      randArr[i * 4 + 2] = Math.random();
      randArr[i * 4 + 3] = Math.random();
    }
    geo.setAttribute("position", new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute("random", new THREE.BufferAttribute(randArr, 4));

    const matcapTex = makeMatcapTexture();
    const pointsMat = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERT,
      fragmentShader: POINTS_FRAG,
      uniforms: {
        uPositions: { value: null },
        uTime: { value: 0 },
        uDPR: { value: dpr },
        uMatcap: { value: matcapTex },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
    const points = new THREE.Points(geo, pointsMat);
    points.frustumCulled = false;
    group.add(points);

    // --- pointer ---
    const pointer = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      px: window.innerWidth / 2,
      py: window.innerHeight / 2,
      has: false,
      lastSplat: 0,
    };

    const onMouse = (e: MouseEvent) => {
      if (!pointer.has) {
        pointer.px = e.clientX;
        pointer.py = e.clientY;
        pointer.has = true;
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      if (!pointer.has) {
        pointer.px = t.clientX;
        pointer.py = t.clientY;
        pointer.has = true;
      }
      pointer.x = t.clientX;
      pointer.y = t.clientY;
    };
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("resize", onResize);

    // --- shared scratch ---
    const projView = new THREE.Matrix4();
    const camRot = new THREE.Matrix3();
    const gazeTarget = new THREE.Vector3().copy(camBase);

    // initialise current positions from the origin texture
    simMat.uniforms.uPositions.value = originTex;
    camera.updateMatrixWorld();
    group.updateMatrixWorld();
    projView
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      ;
    (simMat.uniforms.uProjView.value as THREE.Matrix4).copy(projView);
    (simMat.uniforms.uModel.value as THREE.Matrix4).copy(group.matrixWorld);
    (simMat.uniforms.uCamRot.value as THREE.Matrix3).setFromMatrix4(
      camera.matrixWorld
    );
    simQuad.material = simMat;
    renderer.setRenderTarget(current);
    renderer.render(quadScene, quadCam);
    renderer.setRenderTarget(null);
    pointsMat.uniforms.uPositions.value = current.texture;

    // --- frame loop ---
    const clock = new THREE.Clock();
    let time = 0;
    let raf = 0;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.033);
      const hz = dt * 60;
      time += dt;

      // fluid splats along the pointer trail
      const now = performance.now();
      const dx = pointer.x - pointer.px;
      const dy = pointer.y - pointer.py;
      const len = Math.hypot(dx, dy);
      if (pointer.has && len > 0.01) {
        const rBase =
          mapRange(len, 0, 5, 0, 60) * 0.6 * (isMobile ? 0.8 : 1);
        const force = mapRange(len, 0, 15, 0, 10);
        let sx = pointer.px;
        let sy = pointer.py;
        if (now - pointer.lastSplat > 50) {
          sx = pointer.x;
          sy = pointer.y;
        }
        const w = window.innerWidth;
        const h = window.innerHeight;
        const steps = Math.max(1, Math.min(16, Math.ceil(len / 6)));
        const vx = Math.max(-300, Math.min(300, dx * force));
        const vy = Math.max(-300, Math.min(300, -dy * force));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const x = sx + (pointer.x - sx) * t;
          const y = sy + (pointer.y - sy) * t;
          fluid.splat(x / w, 1 - y / h, vx, vy, rBase / 200);
        }
        pointer.lastSplat = now;
      }
      pointer.px = pointer.x;
      pointer.py = pointer.y;

      // fluid step (fixed dt per spec)
      fluid.step(1 / 60);

      // particle simulation pass
      camera.updateMatrixWorld();
      group.updateMatrixWorld();
      projView.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      (simMat.uniforms.uProjView.value as THREE.Matrix4).copy(projView);
      (simMat.uniforms.uModel.value as THREE.Matrix4).copy(group.matrixWorld);
      (simMat.uniforms.uCamRot.value as THREE.Matrix3).setFromMatrix4(
        camera.matrixWorld
      );
      simMat.uniforms.uPositions.value = current.texture;
      simMat.uniforms.uFluidVel.value = fluid.velocityTexture;
      simMat.uniforms.uFluidDye.value = fluid.dyeTexture;
      simMat.uniforms.uTime.value = time;
      simMat.uniforms.uHZ.value = hz;
      simQuad.material = simMat;
      renderer.setRenderTarget(next);
      renderer.render(quadScene, quadCam);
      renderer.setRenderTarget(null);
      const tmp = current;
      current = next;
      next = tmp;

      pointsMat.uniforms.uPositions.value = current.texture;
      pointsMat.uniforms.uTime.value = time;

      // gaze camera
      const nx = (pointer.x / window.innerWidth) * 2 - 1;
      const ny = (pointer.y / window.innerHeight) * 2 - 1;
      gazeTarget.set(camBase.x + nx * -1, camBase.y + ny * 2, camBase.z);
      camera.position.lerp(gazeTarget, 0.05);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    loop();

    // --- cleanup ---
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      fluid.dispose();
      posA.dispose();
      posB.dispose();
      originTex.dispose();
      matcapTex.dispose();
      pointsMat.dispose();
      simMat.dispose();
      quadGeo.dispose();
      geo.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      id="bg-host"
      aria-hidden="true"
      role="presentation"
    />
  );
}

// kick 1795053790

// kick2 1795053969
