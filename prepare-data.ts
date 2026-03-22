/**
 * One-time data preparation script.
 *
 * Parses COLMAP binary files → JSON camera data, and converts the raw PLY
 * Gaussian splat to PlayCanvas SOG format. Only regenerates when sources
 * are newer than outputs (timestamp check).
 *
 * Usage: bun prepare-data.ts
 *
 * Requires: bun install in frontend/ (for @playcanvas/splat-transform)
 */

import { readFileSync, writeFileSync, mkdirSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const rootDir = import.meta.dirname;

// ---- Paths ----

const colmapDir = path.join(rootDir, 'reconstruction-data/colmap');
const plyPath = path.join(rootDir, 'reconstruction-data/splats/bullet-time.ply');
const neoPlyPath = path.join(rootDir, 'reconstruction-data/splats/bullet-time-neo.ply');
const jsonOut = path.join(rootDir, 'frontend/src/data/postshot-colmap.json');
const sogOut = path.join(rootDir, 'frontend/public/splats/bullet-time.sog');
const neoSogOut = path.join(rootDir, 'frontend/public/splats/bullet-time-neo.sog');

// ---- Helpers ----

function mtime(filepath: string): number {
  try { return statSync(filepath).mtimeMs; } catch { return 0; }
}

// ---- COLMAP binary parser ----

const CAMERA_MODELS: Record<number, { name: string; numParams: number }> = {
  0: { name: 'SIMPLE_PINHOLE', numParams: 3 },
  1: { name: 'PINHOLE', numParams: 4 },
  2: { name: 'SIMPLE_RADIAL', numParams: 4 },
  3: { name: 'RADIAL', numParams: 5 },
  4: { name: 'OPENCV', numParams: 8 },
  5: { name: 'OPENCV_FISHEYE', numParams: 8 },
  6: { name: 'FULL_OPENCV', numParams: 12 },
  7: { name: 'FOV', numParams: 5 },
  8: { name: 'SIMPLE_RADIAL_FISHEYE', numParams: 4 },
  9: { name: 'RADIAL_FISHEYE', numParams: 5 },
  10: { name: 'THIN_PRISM_FISHEYE', numParams: 12 },
};

function parseCamerasBin(buf: Buffer) {
  let off = 0;
  const numCameras = Number(buf.readBigUInt64LE(off)); off += 8;
  const cameras: Record<number, {
    cameraId: number; model: string; width: number; height: number; params: number[];
  }> = {};
  for (let i = 0; i < numCameras; i++) {
    const cameraId = buf.readUInt32LE(off); off += 4;
    const modelId = buf.readInt32LE(off); off += 4;
    const width = Number(buf.readBigUInt64LE(off)); off += 8;
    const height = Number(buf.readBigUInt64LE(off)); off += 8;
    const model = CAMERA_MODELS[modelId] || { name: 'UNKNOWN', numParams: 0 };
    const params: number[] = [];
    for (let p = 0; p < model.numParams; p++) {
      params.push(buf.readDoubleLE(off)); off += 8;
    }
    cameras[cameraId] = { cameraId, model: model.name, width, height, params };
  }
  return cameras;
}

function parseImagesBin(buf: Buffer, cameras: ReturnType<typeof parseCamerasBin>) {
  let off = 0;
  const numImages = Number(buf.readBigUInt64LE(off)); off += 8;
  const images = [];
  for (let i = 0; i < numImages; i++) {
    const imageId = buf.readUInt32LE(off); off += 4;
    const qw = buf.readDoubleLE(off); off += 8;
    const qx = buf.readDoubleLE(off); off += 8;
    const qy = buf.readDoubleLE(off); off += 8;
    const qz = buf.readDoubleLE(off); off += 8;
    const tx = buf.readDoubleLE(off); off += 8;
    const ty = buf.readDoubleLE(off); off += 8;
    const tz = buf.readDoubleLE(off); off += 8;
    const cameraId = buf.readUInt32LE(off); off += 4;
    let name = '';
    while (off < buf.length && buf[off] !== 0) { name += String.fromCharCode(buf[off]); off++; }
    off++;
    const numPoints2D = Number(buf.readBigUInt64LE(off)); off += 8;
    off += numPoints2D * 24;
    const R = [
      [1 - 2 * (qy * qy + qz * qz), 2 * (qx * qy - qz * qw), 2 * (qx * qz + qy * qw)],
      [2 * (qx * qy + qz * qw), 1 - 2 * (qx * qx + qz * qz), 2 * (qy * qz - qx * qw)],
      [2 * (qx * qz - qy * qw), 2 * (qy * qz + qx * qw), 1 - 2 * (qx * qx + qy * qy)],
    ];
    const Cx = -(R[0][0] * tx + R[1][0] * ty + R[2][0] * tz);
    const Cy = -(R[0][1] * tx + R[1][1] * ty + R[2][1] * tz);
    const Cz = -(R[0][2] * tx + R[1][2] * ty + R[2][2] * tz);
    const cam = cameras[cameraId];
    images.push({
      id: imageId, name, qw, qx, qy, qz, tx, ty, tz,
      center: [Cx, Cy, Cz], rotation: R, cameraId,
      width: cam?.width, height: cam?.height, model: cam?.model, params: cam?.params,
    });
  }
  return images;
}

// ---- Main ----

const camerasPath = path.join(colmapDir, 'cameras.bin');
const imagesPath = path.join(colmapDir, 'images.bin');

if (!existsSync(camerasPath)) {
  console.error('reconstruction-data/colmap/ not found');
  process.exit(1);
}

const sourceTime = Math.max(mtime(camerasPath), mtime(imagesPath));
if (sourceTime > mtime(jsonOut)) {
  const cameras = parseCamerasBin(readFileSync(camerasPath));
  const images = parseImagesBin(readFileSync(imagesPath), cameras);
  mkdirSync(path.dirname(jsonOut), { recursive: true });
  writeFileSync(jsonOut, JSON.stringify(images, null, 2));
  console.log(`${Object.keys(cameras).length} cameras, ${images.length} images → ${path.relative(rootDir, jsonOut)}`);
} else {
  console.log('postshot-colmap.json is up to date');
}

if (!existsSync(plyPath)) {
  console.error('reconstruction-data/splats/bullet-time.ply not found');
  process.exit(1);
}

if (mtime(plyPath) > mtime(sogOut)) {
  mkdirSync(path.dirname(sogOut), { recursive: true });
  console.log('Converting PLY → SOG ...');
  execSync(
    `npx splat-transform -w -g 0 -i 3 "${plyPath}" --filter-sphere 0,0,-7,50 "${sogOut}"`,
    { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') },
  );
  console.log(`→ ${path.relative(rootDir, sogOut)}`);
} else {
  console.log('bullet-time.sog is up to date');
}

if (existsSync(neoPlyPath)) {
  if (mtime(neoPlyPath) > mtime(neoSogOut)) {
    mkdirSync(path.dirname(neoSogOut), { recursive: true });
    console.log('Converting Neo PLY → SOG ...');
    execSync(
      `npx splat-transform -w -g 0 -i 3 "${neoPlyPath}" "${neoSogOut}"`,
      { stdio: 'inherit', cwd: path.join(rootDir, 'frontend') },
    );
    console.log(`→ ${path.relative(rootDir, neoSogOut)}`);
  } else {
    console.log('bullet-time-neo.sog is up to date');
  }
} else {
  console.log('bullet-time-neo.ply not found, skipping neo splat');
}
