/**
 * Prepare frontend data from reconstruction outputs.
 *
 * 1. Parse COLMAP binary files (cameras.bin + images.bin) → JSON
 * 2. Convert Gaussian splat PLY → SOG (PlayCanvas super-compressed format)
 *
 * Usage: bun prepare-data.ts [colmap-dir] [output-json]
 * Example: bun prepare-data.ts reconstruction-data/colmap frontend/src/data/postshot-colmap.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

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

// ---- Parse cameras.bin ----

function parseCamerasBin(buf: Buffer) {
  let off = 0;
  const numCameras = Number(buf.readBigUInt64LE(off)); off += 8;

  const cameras: Record<number, {
    cameraId: number;
    model: string;
    width: number;
    height: number;
    params: number[];
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

// ---- Parse images.bin ----

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
    while (off < buf.length && buf[off] !== 0) {
      name += String.fromCharCode(buf[off]);
      off++;
    }
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
      id: imageId,
      name,
      qw, qx, qy, qz,
      tx, ty, tz,
      center: [Cx, Cy, Cz],
      rotation: R,
      cameraId,
      width: cam?.width,
      height: cam?.height,
      model: cam?.model,
      params: cam?.params,
    });
  }

  return images;
}

// ---- Main ----

const colmapDir = process.argv[2] || 'reconstruction-data/colmap';
const outputPath = process.argv[3] || 'frontend/src/data/postshot-colmap.json';

// Step 1: Parse COLMAP binaries → JSON
const cameraBuf = readFileSync(join(colmapDir, 'cameras.bin'));
const imageBuf = readFileSync(join(colmapDir, 'images.bin'));

const cameras = parseCamerasBin(cameraBuf);
const images = parseImagesBin(imageBuf, cameras);

writeFileSync(outputPath, JSON.stringify(images, null, 2));
console.log(`Parsed ${Object.keys(cameras).length} cameras, ${images.length} images → ${outputPath}`);

// Step 2: Convert PLY → SOG
const plyPath = join('reconstruction-data', 'splats', 'bullet-time.ply');
const destDir = join('frontend', 'public', 'splats');
const sogPath = join(destDir, 'bullet-time.sog');
mkdirSync(destDir, { recursive: true });

console.log(`Converting ${plyPath} → ${sogPath} ...`);
execSync(
  `npx splat-transform -w -g 0 -i 3 "${plyPath}" --filter-sphere 0,0,-7,50 "${sogPath}"`,
  { stdio: 'inherit' },
);
console.log(`Done.`);
