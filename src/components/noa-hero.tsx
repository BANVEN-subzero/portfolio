"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Noa Ellsworth-style holographic point-cloud hero.
 * Builds a 66,000-dot bust from a streamed GLB, with ring loader,
 * assemble animation, cursor light, head turn, glint, shine, and dust.
 *
 * Spec values are taken directly from the reference page.
 */

const GLB_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261115_071021_742152ba-5554-4270-9dc5-286bcff36a1a.glb";
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";
const ADDONS_BASE = "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/";

const RING_CIRCLES = 96;

// Pre-compute the 96 ring circle positions: angle = (i/96)*2π − π/2, r=92
const RING_POSITIONS = Array.from({ length: RING_CIRCLES }, (_, i) => {
  const angle = (i / RING_CIRCLES) * Math.PI * 2 - Math.PI / 2;
  return {
    cx: +(92 * Math.cos(angle)).toFixed(2),
    cy: +(92 * Math.sin(angle)).toFixed(2),
  };
});

const GRAIN_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.7 0 0 0 -0.6'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>`
  );

export default function NoaHero() {
  const stageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer: any = null;
    let onPointerMove: ((e: PointerEvent) => void) | null = null;
    let onPointerLeave: (() => void) | null = null;
    let onResize: (() => void) | null = null;
    let lastTouchTimer: any = null;

    (async () => {
      // Dynamic import that bypasses bundler static analysis
      const dyn = new Function("u", "return import(u)") as (
        u: string
      ) => Promise<any>;
      let THREE: any;
      let GLTFLoader: any;
      let MeshSurfaceSampler: any;
      try {
        THREE = await dyn(THREE_URL);
        const gltfMod = await dyn(ADDONS_BASE + "loaders/GLTFLoader.js");
        GLTFLoader = gltfMod.GLTFLoader;
        const samplerMod = await dyn(ADDONS_BASE + "math/MeshSurfaceSampler.js");
        MeshSurfaceSampler = samplerMod.MeshSurfaceSampler;
      } catch (e: any) {
        console.error("[NoaHero] import error:", e?.message || e);
        if (disposed) return;
        setPhase("error");
        return;
      }
      if (disposed) return;

      const stage = stageRef.current;
      if (!stage) return;

      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      // ---- Renderer ----
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x0f110d, 1);
      renderer.setPixelRatio(dpr);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      stage.appendChild(renderer.domElement);

      const gl = renderer.getContext();

      // ---- Scene + camera ----
      const scene = new THREE.Scene();
      const TARGET = new THREE.Vector3(0, -0.15, 0);
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      camera.position.set(0, -0.15, 5);
      camera.lookAt(TARGET);

      function resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        const aspect = w / h;
        const dist = Math.max(2.35 / Math.tan((15 * Math.PI) / 180), 1.7 / (Math.tan((15 * Math.PI) / 180) * aspect));
        camera.position.set(0, -0.15, dist);
        camera.lookAt(TARGET);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        // Ring center + radius in world units: 1 CSS px at bust depth = 2*dist*tan(15°)/h world units
        const pxToWorld = (2 * dist * Math.tan((15 * Math.PI) / 180)) / h;
        ringCenterWorld.set(0, -0.15, 0);
        ringRadiusWorld = 92 * pxToWorld;
      }
      const ringCenterWorld = new THREE.Vector3(0, -0.15, 0);
      let ringRadiusWorld = 1;
      onResize = resize;
      resize();
      window.addEventListener("resize", resize);

      // ---- Fetch GLB with progress ----
      let glbBuffer: ArrayBuffer;
      try {
        const resp = await fetch(GLB_URL);
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        const contentLength = resp.headers.get("content-length");
        const total = contentLength ? parseInt(contentLength) : 1.5 * 1024 * 1024;
        const reader = resp.body?.getReader();
        if (!reader) throw new Error("no reader");
        const chunks: Uint8Array[] = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            if (!disposed)
              setProgress(Math.min(0.999, received / total));
          }
        }
        glbBuffer = new Blob(chunks).arrayBuffer
          ? await new Blob(chunks).arrayBuffer()
          : new ArrayBuffer(0);
        // Fallback: concat chunks manually
        if (!glbBuffer || glbBuffer.byteLength === 0) {
          let totalLen = 0;
          for (const c of chunks) totalLen += c.length;
          glbBuffer = new ArrayBuffer(totalLen);
          const view = new Uint8Array(glbBuffer);
          let off = 0;
          for (const c of chunks) {
            view.set(c, off);
            off += c.length;
          }
        }
      } catch (e: any) {
        console.error("[NoaHero] GLB fetch error:", e?.message || e);
        if (disposed) return;
        setPhase("error");
        return;
      }
      const loader = new GLTFLoader();
      let gltf: any;
      try {
        gltf = await new Promise((resolve, reject) => {
          loader.parse(glbBuffer, "", resolve, reject);
        });
      } catch (e: any) {
        console.error("[NoaHero] GLB parse error:", e?.message || e);
        if (disposed) return;
        setPhase("error");
        return;
      }
      if (disposed) return;

      // Find first mesh, apply world matrix, compute normals
      let mesh: any = null;
      gltf.scene.traverse((obj: any) => {
        if (!mesh && obj.isMesh) mesh = obj;
      });
      if (!mesh) {
        setPhase("error");
        return;
      }
      mesh.updateMatrixWorld(true);
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(mesh.matrixWorld);
      if (!geo.attributes.normal) geo.computeVertexNormals();

      // ---- Sample 330,000 candidates ----
      const sampler = new MeshSurfaceSampler(mesh).build();
      // Rebuild sampler on the cloned geometry
      const sampler2 = new MeshSurfaceSampler(
        new THREE.Mesh(geo, new THREE.MeshBasicMaterial())
      ).build();

      const N_CANDIDATES = 330000;
      const N_DOTS = 66000;
      const candPos = new Float32Array(N_CANDIDATES * 3);
      const candNorm = new Float32Array(N_CANDIDATES * 3);
      const candRand = new Float32Array(N_CANDIDATES);
      const tmpP = new THREE.Vector3();
      const tmpN = new THREE.Vector3();
      for (let i = 0; i < N_CANDIDATES; i++) {
        sampler2.sample(tmpP, tmpN);
        candPos[i * 3] = tmpP.x;
        candPos[i * 3 + 1] = tmpP.y;
        candPos[i * 3 + 2] = tmpP.z;
        candNorm[i * 3] = tmpN.x;
        candNorm[i * 3 + 1] = tmpN.y;
        candNorm[i * 3 + 2] = tmpN.z;
        candRand[i] = Math.random();
      }

      // ---- Leaf candidates (part 2) ----
      // Leaf when x > 0.13, y > 0.6 and (x-0.02)² + (z+0.06)² > 0.035
      const leafIdx: number[] = [];
      for (let i = 0; i < N_CANDIDATES; i++) {
        const x = candPos[i * 3];
        const y = candPos[i * 3 + 1];
        const z = candPos[i * 3 + 2];
        if (
          x > 0.13 &&
          y > 0.6 &&
          (x - 0.02) * (x - 0.02) + (z + 0.06) * (z + 0.06) > 0.035
        ) {
          leafIdx.push(i);
        }
      }
      // Keep first 60% of leaf candidates
      const nLeaf = Math.floor(leafIdx.length * 0.6);
      const keptLeaf = leafIdx.slice(0, nLeaf);

      // ---- Voxel thinning for bust dots ----
      const VOX = 0.022;
      const voxMap = new Map<string, number[]>();
      const used = new Uint8Array(N_CANDIDATES);
      // Mark leaf candidates as used (they skip the cap)
      for (const idx of keptLeaf) used[idx] = 2;

      // Put non-leaf candidates in voxels
      for (let i = 0; i < N_CANDIDATES; i++) {
        if (used[i]) continue;
        const x = candPos[i * 3];
        const y = candPos[i * 3 + 1];
        const z = candPos[i * 3 + 2];
        const key =
          Math.floor(x / VOX) + "," + Math.floor(y / VOX) + "," + Math.floor(z / VOX);
        let arr = voxMap.get(key);
        if (!arr) {
          arr = [];
          voxMap.set(key, arr);
        }
        arr.push(i);
      }

      // Binary search for cap
      const target = 1.8 * N_DOTS;
      let lo = 1,
        hi = 0;
      for (const arr of voxMap.values()) if (arr.length > hi) hi = arr.length;
      const voxelArrays = Array.from(voxMap.values());
      const findSum = (cap: number) => {
        let s = 0;
        for (const arr of voxelArrays) s += Math.min(arr.length, cap);
        return s;
      };
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (findSum(mid) < target) lo = mid + 1;
        else hi = mid;
      }
      const cap = lo;
      const pool: number[] = [];
      for (const arr of voxelArrays) {
        const n = Math.min(arr.length, cap);
        for (let i = 0; i < n; i++) pool.push(arr[i]);
      }
      // Shuffle pool
      for (let i = pool.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }

      // ---- Visor (parts 3 + 4) — simplified ----
      // Build a front height map of the face
      const faceMap = new Map<string, number>();
      for (let i = 0; i < N_CANDIDATES; i++) {
        const x = candPos[i * 3];
        const y = candPos[i * 3 + 1];
        const z = candPos[i * 3 + 2];
        const nz = candNorm[i * 3 + 2];
        if (nz >= 0.2 && x > -0.32 && x < 0.32 && y > 0.2 && y < 0.45) {
          const key = (Math.round(x * 100) / 100).toFixed(2) + "," + (Math.round(y * 100) / 100).toFixed(2);
          const prev = faceMap.get(key);
          if (prev === undefined || z > prev) faceMap.set(key, z);
        }
      }
      const faceHeight = (x: number, y: number) => {
        let best = -1;
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const k =
              (Math.round((x + dx * 0.01) * 100) / 100).toFixed(2) +
              "," +
              (Math.round((y + dy * 0.01) * 100) / 100).toFixed(2);
            const v = faceMap.get(k);
            if (v !== undefined && v > best) best = v;
          }
        }
        return best;
      };
      const W = 0.215;
      const topEdge = (x: number) => 0.378 - 0.022 * (x / W) * (x / W);
      const lowEdge = (x: number) =>
        0.282 + 0.032 * Math.exp(-((x / 0.034) ** 2)) + 0.026 * (x / W) ** 4;
      // Front = highest face height over x -0.06..0.06, y 0.30..0.36 + clearance 0.028
      let frontBase = -1;
      for (let i = 0; i < N_CANDIDATES; i++) {
        const x = candPos[i * 3];
        const y = candPos[i * 3 + 1];
        const z = candPos[i * 3 + 2];
        if (x > -0.06 && x < 0.06 && y > 0.3 && y < 0.36 && z > frontBase)
          frontBase = z;
      }
      const front = frontBase + 0.028;
      // wrap = smallest (front - need - 0.7*clearance)/x² over x from -W to W in 0.01 steps, |x|>=0.05
      // need = highest face height between lower and top edges at that x
      let wrap = 2.4;
      for (let x = -W; x <= W; x += 0.01) {
        if (Math.abs(x) < 0.05) continue;
        const need = (function () {
          let best = -1;
          const yLo = lowEdge(x);
          const yHi = topEdge(x);
          for (let yy = yLo; yy <= yHi; yy += 0.005) {
            const h = faceHeight(x, yy);
            if (h !== undefined && h > best) best = h;
          }
          return best < 0 ? 0 : best;
        })();
        const cand = (front - need - 0.7 * 0.028) / (x * x);
        if (cand < wrap) wrap = cand;
      }
      if (!isFinite(wrap) || wrap <= 0) wrap = 2.4;

      const lensZ = (x: number) => front - wrap * x * x;
      const visorDots: { pos: number[]; norm: number[]; part: number }[] = [];
      const lensNorm = (x: number) => {
        const nx = 2 * wrap * x;
        const ny = 0;
        const nz = 1;
        const len = Math.hypot(nx, ny, nz);
        return [nx / len, ny / len, nz / len];
      };

      // 950 top bar dots
      for (let i = 0; i < 950; i++) {
        const x = -W + (i / 950) * 2 * W;
        const yJit = Math.random() * 0.016 * (1 - Math.random());
        const y = topEdge(x) - yJit;
        const z = lensZ(x) + 0.004;
        visorDots.push({ pos: [x, y, z], norm: lensNorm(x), part: 2 });
      }
      // 380 lower edge dots
      for (let i = 0; i < 380; i++) {
        const x = -W + (i / 380) * 2 * W;
        const y = lowEdge(x);
        const z = lensZ(x) + 0.002;
        visorDots.push({ pos: [x, y, z], norm: lensNorm(x), part: 2 });
      }
      // 70 at each end
      for (let s = 0; s < 2; s++) {
        const x = s === 0 ? -W : W;
        for (let i = 0; i < 70; i++) {
          const yLo = lowEdge(x);
          const yHi = topEdge(x);
          const y = yLo + Math.random() * (yHi - yLo);
          const z = lensZ(x);
          visorDots.push({ pos: [x, y, z], norm: lensNorm(x), part: 2 });
        }
      }
      // 1500 lens dots
      for (let i = 0; i < 1500; i++) {
        const x = -W + Math.random() * 2 * W;
        const yLo = lowEdge(x);
        const yHi = topEdge(x);
        const y = yLo + Math.random() * (yHi - yLo);
        const z = lensZ(x) + (Math.random() - 0.5) * 0.004;
        visorDots.push({ pos: [x, y, z], norm: lensNorm(x), part: 3 });
      }
      // 70 per side arms
      for (let s = 0; s < 2; s++) {
        const x0 = s === 0 ? -W : W;
        const dir = s === 0 ? -1 : 1;
        for (let i = 0; i < 70; i++) {
          const t = i / 70;
          const x = x0 + dir * 0.03 * t;
          const z = -0.15 * t;
          const y = topEdge(x0) - 0.008;
          visorDots.push({ pos: [x, y, z], norm: [0, 0, 1], part: 2 });
        }
      }

      // ---- Assemble final dot list ----
      const nVisor = visorDots.length;
      const nBustNeeded = N_DOTS - nVisor - nLeaf;
      const bustPool = pool.slice(0, Math.min(nBustNeeded, pool.length));

      const finalPos: number[] = [];
      const finalNorm: number[] = [];
      const finalRand: number[] = [];
      const finalPart: number[] = [];
      const finalShade: number[] = []; // ridge, thin pairs

      const placeDot = (
        px: number,
        py: number,
        pz: number,
        nx: number,
        ny: number,
        nz: number,
        part: number
      ) => {
        const wx = px * 2.8;
        const wy = py * 2.8 - 0.68;
        const wz = pz * 2.8;
        finalPos.push(wx, wy, wz);
        finalNorm.push(nx, ny, nz);
        finalRand.push(Math.random());
        finalPart.push(part);
      };

      for (const vd of visorDots) {
        placeDot(vd.pos[0], vd.pos[1], vd.pos[2], vd.norm[0], vd.norm[1], vd.norm[2], vd.part);
      }
      for (const idx of keptLeaf) {
        placeDot(
          candPos[idx * 3],
          candPos[idx * 3 + 1],
          candPos[idx * 3 + 2],
          candNorm[idx * 3],
          candNorm[idx * 3 + 1],
          candNorm[idx * 3 + 2],
          1
        );
      }
      for (const idx of bustPool) {
        placeDot(
          candPos[idx * 3],
          candPos[idx * 3 + 1],
          candPos[idx * 3 + 2],
          candNorm[idx * 3],
          candNorm[idx * 3 + 1],
          candNorm[idx * 3 + 2],
          0
        );
      }

      // ---- Compute aShade (ridge + thin) ----
      const R = 0.03;
      const hashCell = R;
      const hash = new Map<string, number[]>();
      const half = Math.floor(N_CANDIDATES / 2);
      for (let i = 0; i < half; i++) {
        const x = candPos[i * 3];
        const y = candPos[i * 3 + 1];
        const z = candPos[i * 3 + 2];
        const key =
          Math.floor(x / hashCell) + "," + Math.floor(y / hashCell) + "," + Math.floor(z / hashCell);
        let arr = hash.get(key);
        if (!arr) {
          arr = [];
          hash.set(key, arr);
        }
        arr.push(i);
      }
      const neighbors = (x: number, y: number, z: number) => {
        const out: number[] = [];
        const cx = Math.floor(x / hashCell);
        const cy = Math.floor(y / hashCell);
        const cz = Math.floor(z / hashCell);
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dz = -1; dz <= 1; dz++) {
              const k = (cx + dx) + "," + (cy + dy) + "," + (cz + dz);
              const arr = hash.get(k);
              if (arr) out.push(...arr);
            }
          }
        }
        return out;
      };

      const nFinal = finalPos.length / 3;
      const ridgeArr = new Float32Array(nFinal);
      const thinArr = new Float32Array(nFinal);
      const counts: number[] = [];
      const ridgeVals: number[] = [];
      for (let i = 0; i < nFinal; i++) {
        // Convert back to model units for neighbor lookup
        const wx = finalPos[i * 3];
        const wy = finalPos[i * 3 + 1];
        const wz = finalPos[i * 3 + 2];
        const mx = wx / 2.8;
        const my = (wy + 0.68) / 2.8;
        const mz = wz / 2.8;
        const nx = finalNorm[i * 3];
        const ny = finalNorm[i * 3 + 1];
        const nz = finalNorm[i * 3 + 2];
        const ns = neighbors(mx, my, mz);
        let sumOffset = 0;
        let count = 0;
        for (const j of ns) {
          const ox = candPos[j * 3] - mx;
          const oy = candPos[j * 3 + 1] - my;
          const oz = candPos[j * 3 + 2] - mz;
          sumOffset += ox * nx + oy * ny + oz * nz;
          count++;
        }
        const avgOffset = count > 0 ? sumOffset / count : 0;
        const ridge = -(avgOffset / R);
        ridgeVals.push(Math.abs(ridge));
        ridgeArr[i] = ridge;
        counts.push(count);
      }
      // Normalize ridge by 90th percentile
      const sortedRidge = [...ridgeVals].sort((a, b) => a - b);
      const p90 = sortedRidge[Math.floor(sortedRidge.length * 0.9)] || 1;
      for (let i = 0; i < nFinal; i++) {
        ridgeArr[i] = Math.max(-1, Math.min(1, ridgeArr[i] / p90));
      }
      // thin = 1 - count/(0.55*median), clamped 0..1
      const sortedCounts = [...counts].sort((a, b) => a - b);
      const medCount = sortedCounts[Math.floor(sortedCounts.length / 2)] || 1;
      for (let i = 0; i < nFinal; i++) {
        thinArr[i] = Math.max(0, Math.min(1, 1 - counts[i] / (0.55 * medCount)));
      }

      // ---- Find smallest/largest non-bust x for glint sweep ----
      let glintMin = Infinity,
        glintMax = -Infinity;
      for (let i = 0; i < nFinal; i++) {
        if (finalPart[i] !== 0) {
          // Use model-space x = wx/2.8
          const mx = finalPos[i * 3] / 2.8;
          if (mx < glintMin) glintMin = mx;
          if (mx > glintMax) glintMax = mx;
        }
      }
      if (!isFinite(glintMin)) {
        glintMin = -0.2;
        glintMax = 0.2;
      }

      // ---- Build geometry ----
      const bustGeo = new THREE.BufferGeometry();
      bustGeo.setAttribute("position", new THREE.Float32BufferAttribute(finalPos, 3));
      bustGeo.setAttribute("normal", new THREE.Float32BufferAttribute(finalNorm, 3));
      bustGeo.setAttribute("aRand", new THREE.Float32BufferAttribute(finalRand, 1));
      bustGeo.setAttribute("aPart", new THREE.Float32BufferAttribute(finalPart, 1));
      const shadeArr = new Float32Array(nFinal * 2);
      for (let i = 0; i < nFinal; i++) {
        shadeArr[i * 2] = ridgeArr[i];
        shadeArr[i * 2 + 1] = thinArr[i];
      }
      bustGeo.setAttribute("aShade", new THREE.Float32BufferAttribute(shadeArr, 2));

      const BUST_VERT = `
        attribute float aRand;
        attribute vec2 aShade;
        attribute float aPart;
        uniform float uTime, uAssemble, uSize, uGlint, uShine;
        uniform vec2 uHead;
        uniform vec3 uLight, uRingCenter;
        uniform float uRingRadius;
        uniform vec3 uInk, uBlue, uCream;
        varying float vBright;
        varying vec3 vColor;
        varying float vAlpha;
        mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
        mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }
        void main(){
          vec3 home = position;
          vec3 n = normal;
          float head = smoothstep(-1.3, -0.6, home.y);
          mat3 mY = rotY(uHead.x * (0.25 + 0.75 * head));
          mat3 mX = rotX(uHead.y * head);
          vec3 piv = home - vec3(0., -1., 0.);
          vec3 turned = mX * mY * piv + vec3(0., -1., 0.);
          vec3 turnedN = mX * mY * n;
          turned += turnedN * sin(uTime * 1.4 + aRand * 60.) * 0.006;
          float r2 = fract(sin(aRand * 91.7) * 43758.5453);
          float t = clamp((uAssemble - aRand * 0.45) / 0.55, 0., 1.);
          float e = t < 0.5 ? 4.*t*t*t : 1. - pow(-2.*t + 2., 3.) / 2.;
          float ang = aRand * 6.2831853;
          vec3 start = uRingCenter + vec3(cos(ang), sin(ang), 0.) * uRingRadius * (1. + (r2 - 0.5) * 0.06);
          vec3 arc = vec3(sin(aRand * 40. + uTime * 0.3), cos(aRand * 31.), 0.9 + r2 * 1.4) * sin(e * 3.14159) * 0.45;
          vec4 mv = modelViewMatrix * vec4(mix(start, turned, e) + arc, 1.);
          float depth = -mv.z;
          vec3 toLight = uLight - turned;
          vec3 toLightN = normalize(toLight);
          float lit = max(dot(turnedN, toLightN), 0.) / (1. + dot(toLight, toLight) * 0.32);
          vec3 keyDir = normalize(vec3(-0.5, 0.6, 0.7));
          float key = max(dot(turnedN, keyDir), 0.);
          float facing = turnedN.z;
          float rim = pow(1. - abs(facing), 3.);
          float b = 0.3 + key * 0.22 + lit * 1.5 + rim * 0.14;
          b *= mix(0.55, 1., smoothstep(-0.3, 0.25, facing));
          float ridge = aShade.x;
          float thin = aShade.y;
          b *= ridge > 0. ? (1. + ridge * 0.7) : (1. + ridge * 0.5);
          b += thin * (0.26 + key * 0.3);
          if (aPart > 0.5 && aPart < 1.5) b *= 0.9;
          if (aPart > 1.5) b *= 0.78;
          if (aPart > 2.5) b *= 0.7;
          b *= 0.7 + r2 * 0.5;
          if (aPart > 0.5) {
            float glint = smoothstep(0.09, 0., abs(home.x - uGlint));
            b += glint * 1.2;
          }
          float band = turned.y - turned.x * 0.5 - uShine;
          float shine = exp(-band * band * 4.);
          b += shine * 1.3;
          vAlpha = mix(0.75, 1., e);
          gl_PointSize = uSize * (0.45 + r2 * r2 * 1.3) * (1. + shine * 0.6) / depth;
          gl_Position = projectionMatrix * mv;
          vec3 ink = uInk;
          ink = mix(ink, uCream, shine * 0.6);
          if (aPart > 2.5) ink = mix(ink, uBlue, 0.6);
          if (aPart > 0.5) {
            float glint = smoothstep(0.09, 0., abs(home.x - uGlint));
            ink = mix(ink, uBlue, glint * 0.7);
          }
          vColor = ink;
          vBright = b;
        }
      `;
      const BUST_FRAG = `
        varying float vBright;
        varying vec3 vColor;
        varying float vAlpha;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float r = dot(c, c);
          if (r > 0.25) discard;
          float alpha = exp(-16. * r) * vAlpha;
          gl_FragColor = vec4(vColor * vBright, alpha);
        }
      `;
      const bustMat = new THREE.ShaderMaterial({
        vertexShader: BUST_VERT,
        fragmentShader: BUST_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uAssemble: { value: reduced ? 1 : 0 },
          uSize: { value: 26 * dpr },
          uGlint: { value: -9 },
          uShine: { value: reduced ? 99 : 99 },
          uHead: { value: new THREE.Vector2(0, 0) },
          uLight: { value: new THREE.Vector3(-1.4, 1.2, 1.6) },
          uRingCenter: { value: ringCenterWorld },
          uRingRadius: { value: ringRadiusWorld },
          uInk: { value: new THREE.Color(0xc9d4b8) },
          uBlue: { value: new THREE.Color(0x7fa8a3) },
          uCream: { value: new THREE.Color(0xf0e5c8) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const bustPoints = new THREE.Points(bustGeo, bustMat);
      bustPoints.frustumCulled = false;
      scene.add(bustPoints);

      // ---- Cursor light ----
      const lightGeo = new THREE.BufferGeometry();
      lightGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 0, 0], 3)
      );
      lightGeo.setAttribute("aRand", new THREE.Float32BufferAttribute([0], 1));
      const LIGHT_VERT = `
        attribute float aRand;
        uniform float uOn;
        uniform float uDpr;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.);
          float depth = -mv.z;
          gl_PointSize = 240. * uDpr * uOn / depth;
          gl_Position = projectionMatrix * mv;
        }
      `;
      const LIGHT_FRAG = `
        uniform float uOn;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float dist = length(c);
          float rr = 2. * dist;
          float core = smoothstep(0.14, 0.08, rr);
          float glow = exp(-4. * rr) * 0.45 + exp(-12. * rr) * 0.7;
          float a = (core + glow) * uOn;
          gl_FragColor = vec4(1., 1., 1., a);
        }
      `;
      const lightMat = new THREE.ShaderMaterial({
        vertexShader: LIGHT_VERT,
        fragmentShader: LIGHT_FRAG,
        uniforms: {
          uOn: { value: reduced ? 1 : 0 },
          uDpr: { value: dpr },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const lightPoints = new THREE.Points(lightGeo, lightMat);
      lightPoints.frustumCulled = false;
      scene.add(lightPoints);

      // ---- Dust ----
      const N_DUST = 900;
      const dustPos = new Float32Array(N_DUST * 3);
      const dustRand = new Float32Array(N_DUST);
      for (let i = 0; i < N_DUST; i++) {
        dustPos[i * 3] = (Math.random() * 2 - 1) * 9;
        dustPos[i * 3 + 1] = (Math.random() * 2 - 1) * 6;
        dustPos[i * 3 + 2] = (Math.random() * 2 - 1) * 4 - 2;
        dustRand[i] = Math.random();
      }
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.Float32BufferAttribute(dustPos, 3));
      dustGeo.setAttribute("aRand", new THREE.Float32BufferAttribute(dustRand, 1));
      const DUST_VERT = `
        attribute float aRand;
        uniform float uTime, uOn, uDpr;
        varying float vBright;
        void main(){
          vec3 pos = position;
          pos.y = mod(pos.y + uTime * (0.03 + aRand * 0.05) + 6., 12.) - 6.;
          pos.x += sin(uTime * 0.2 + aRand * 40.) * 0.15;
          vec4 mv = modelViewMatrix * vec4(pos, 1.);
          float depth = -mv.z;
          gl_PointSize = 22. * uDpr * (0.5 + aRand) / depth;
          vBright = (0.1 + aRand * 0.18) * uOn;
          gl_Position = projectionMatrix * mv;
        }
      `;
      const DUST_FRAG = `
        uniform vec3 uInk;
        varying float vBright;
        void main(){
          vec2 c = gl_PointCoord - 0.5;
          float r = dot(c, c);
          if (r > 0.25) discard;
          float alpha = exp(-16. * r) * vBright;
          gl_FragColor = vec4(uInk * alpha, alpha);
        }
      `;
      const dustMat = new THREE.ShaderMaterial({
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uOn: { value: reduced ? 1 : 0 },
          uDpr: { value: dpr },
          uInk: { value: new THREE.Color(0xc9d4b8) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const dustPoints = new THREE.Points(dustGeo, dustMat);
      dustPoints.frustumCulled = false;
      scene.add(dustPoints);

      // ---- Pointer ----
      const pointer = {
        x: 0,
        y: 0,
        active: false,
        lastTouch: 0,
      };
      const raycaster = new THREE.Raycaster();
      const ndc = new THREE.Vector2();
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -2.6);
      const hit = new THREE.Vector3();
      const lightTarget = new THREE.Vector3(-1.4, 1.2, 1.6);
      const headTarget = new THREE.Vector2(0, 0);

      onPointerMove = (e: PointerEvent) => {
        pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
        pointer.active = true;
        pointer.lastTouch = performance.now();
      };
      onPointerLeave = () => {
        pointer.active = false;
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerdown", onPointerMove);
      window.addEventListener("pointerleave", onPointerLeave);

      // ---- Progress = 1 ----
      setProgress(1);
      if (reduced) {
        setPhase("ready");
      } else {
        await new Promise((r) => setTimeout(r, 380));
        if (disposed) return;
        setPhase("ready");
      }

      // ---- Animation loop ----
      const clock = new THREE.Clock();
      let elapsed = 0;
      let lastGlint = 4.6;
      let glintActive = false;
      let glintStart = 0;

      const loop = () => {
        if (disposed) return;
        raf = requestAnimationFrame(loop);
        const dt = Math.min(clock.getDelta(), 0.05);
        if (!reduced) elapsed += dt;
        const t = elapsed;

        // Assemble
        const uAssemble = reduced ? 1 : Math.min(1, t / 2.6);
        bustMat.uniforms.uAssemble.value = uAssemble;
        bustMat.uniforms.uTime.value = reduced ? 0 : t;

        // Light + dust on
        const lightOnTarget = reduced ? 1 : Math.min(1, 1.6 * uAssemble);
        const dustOnTarget = 1;
        const easeRate = (rate: number) => 1 - Math.exp(-dt * rate);
        lightMat.uniforms.uOn.value +=
          (lightOnTarget - lightMat.uniforms.uOn.value) * easeRate(4);
        dustMat.uniforms.uOn.value +=
          (dustOnTarget - dustMat.uniforms.uOn.value) * easeRate(0.8);
        dustMat.uniforms.uTime.value = t;

        // Shine: t = 2.34 → 4.54
        if (!reduced && t >= 2.34 && t <= 4.54) {
          const s = (t - 2.34) / 2.2;
          bustMat.uniforms.uShine.value =
            2.8 - (1 - (1 - s) * (1 - s)) * 7.4;
        } else if (!reduced) {
          bustMat.uniforms.uShine.value = 99;
        }

        // Glint: t = 4.6 then every 4.2s
        if (!reduced) {
          if (!glintActive && t >= lastGlint) {
            glintActive = true;
            glintStart = t;
          }
          if (glintActive) {
            const gt = t - glintStart;
            if (gt <= 0.9) {
              const p = gt / 0.9;
              bustMat.uniforms.uGlint.value =
                glintMin - 0.15 + p * (glintMax - glintMin + 0.3);
            } else {
              bustMat.uniforms.uGlint.value = -9;
              glintActive = false;
              lastGlint = t + 4.2 - 0.9;
            }
          }
        }

        // Pointer / idle orbit
        const timeSinceTouch = (performance.now() - pointer.lastTouch) / 1000;
        const isIdle = !pointer.active || timeSinceTouch > 1.5;
        if (isIdle) {
          // Orbit
          lightTarget.set(
            1.9 * Math.sin(0.45 * t),
            0.5 + 0.8 * Math.cos(0.33 * t),
            2.6
          );
          headTarget.set(
            0.35 * Math.sin(0.45 * t),
            0.12 * Math.cos(0.33 * t)
          );
        } else {
          // Ray from camera through pointer
          ndc.set(pointer.x, pointer.y);
          raycaster.setFromCamera(ndc, camera);
          if (raycaster.ray.intersectPlane(plane, hit)) {
            lightTarget.copy(hit);
          }
          headTarget.set(0.5 * pointer.x, 0.18 * pointer.y);
        }
        // Exponential smoothing
        const lerpRate = (rate: number) => 1 - Math.exp(-dt * rate);
        (bustMat.uniforms.uLight.value as THREE.Vector3).lerp(
          lightTarget,
          isIdle ? (reduced ? 1 : lerpRate(reduced ? 99 : 5)) : (reduced ? 1 : lerpRate(5))
        );
        // uHead = (head.x, -head.y)
        const uh = bustMat.uniforms.uHead.value as THREE.Vector2;
        uh.x += (headTarget.x - uh.x) * (isIdle ? lerpRate(1.5) : lerpRate(3));
        uh.y += (-headTarget.y - uh.y) * (isIdle ? lerpRate(1.5) : lerpRate(3));

        // Light position
        lightPoints.position.copy(bustMat.uniforms.uLight.value as THREE.Vector3);

        renderer.render(scene, camera);
      };
      loop();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (onPointerMove) {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerdown", onPointerMove);
      }
      if (onPointerLeave)
        window.removeEventListener("pointerleave", onPointerLeave);
      if (onResize) window.removeEventListener("resize", onResize);
      if (renderer) {
        try {
          renderer.dispose();
          if (renderer.domElement?.parentNode === stageRef.current)
            stageRef.current?.removeChild(renderer.domElement);
        } catch {}
      }
    };
  }, []);

  const counterText =
    phase === "error"
      ? "ERR"
      : String(Math.round(progress * 100)).padStart(3, "0");
  const labelText =
    phase === "error" ? "Refresh to try again" : "66,000 dots";

  return (
    <section
      ref={heroRef as any}
      className="noa-hero"
      data-phase={phase}
      aria-label="Holographic portrait"
    >
      <div ref={stageRef} className="noa-stage" aria-hidden="true" />
      <div
        className="noa-grain"
        aria-hidden="true"
        style={{ backgroundImage: `url("${GRAIN_DATA_URI}")` }}
      />

      {/* Loader */}
      <div
        className="noa-loader"
        role="progressbar"
        aria-label="Loading the dots"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <svg
          className="noa-ring"
          viewBox="-110 -110 220 220"
          aria-hidden="true"
        >
          {RING_POSITIONS.map((p, i) => {
            const lit = i / RING_CIRCLES < progress;
            return (
              <circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={lit ? 2.2 : 1.6}
                className={lit ? "noa-ring-on" : "noa-ring-off"}
                data-on={lit ? "true" : undefined}
              />
            );
          })}
        </svg>
        <span className="noa-counter">{counterText}</span>
        <span className="noa-label">{labelText}</span>
      </div>

      {/* Text */}
      <a className="noa-logo" href="#top">
        Banven.
      </a>
      <h1 className="noa-name">Banven Eric</h1>
      <p className="noa-tagline">
        Builds practical software for low-bandwidth contexts
      </p>
      <p className="noa-hint">Move the light</p>
      <a className="noa-pill" href="#work">
        View selected work →
      </a>
    </section>
  );
}
