import { writeFileSync, mkdirSync, statSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import type { Plugin } from 'vite';
import { parseColmap } from './parse-colmap';

function mtime(filepath: string): number {
  try { return statSync(filepath).mtimeMs; } catch { return 0; }
}

export function prepareData(rootDir: string): Plugin {
  const colmapDir = path.resolve(rootDir, 'reconstruction-data/colmap');
  const plyPath = path.resolve(rootDir, 'reconstruction-data/splats/bullet-time.ply');
  const jsonOut = path.resolve(rootDir, 'frontend/src/data/postshot-colmap.json');
  const sogOut = path.resolve(rootDir, 'frontend/public/splats/bullet-time.sog');

  return {
    name: 'prepare-data',
    buildStart() {
      const camerasPath = path.join(colmapDir, 'cameras.bin');
      const imagesPath = path.join(colmapDir, 'images.bin');

      if (!existsSync(camerasPath)) {
        this.warn('reconstruction-data/colmap/ not found, skipping data preparation');
        return;
      }

      const sourceTime = Math.max(mtime(camerasPath), mtime(imagesPath));
      if (sourceTime > mtime(jsonOut)) {
        const { cameras, images } = parseColmap(colmapDir);
        mkdirSync(path.dirname(jsonOut), { recursive: true });
        writeFileSync(jsonOut, JSON.stringify(images, null, 2));
        console.log(`[prepare-data] ${Object.keys(cameras).length} cameras, ${images.length} images → ${path.relative(rootDir, jsonOut)}`);
      }

      if (!existsSync(plyPath)) {
        this.warn('reconstruction-data/splats/bullet-time.ply not found, skipping SOG conversion');
        return;
      }

      if (mtime(plyPath) > mtime(sogOut)) {
        mkdirSync(path.dirname(sogOut), { recursive: true });
        console.log(`[prepare-data] Converting PLY → SOG ...`);
        execSync(
          `npx splat-transform -w -g 0 -i 3 "${plyPath}" --filter-sphere 0,0,-7,50 "${sogOut}"`,
          { stdio: 'inherit' },
        );
        console.log(`[prepare-data] → ${path.relative(rootDir, sogOut)}`);
      }
    },
  };
}
