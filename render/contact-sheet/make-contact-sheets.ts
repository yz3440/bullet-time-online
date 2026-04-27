/**
 * Builds two identically-laid-out contact sheets:
 *   render/contact-sheet/original.png  — from frontend/public/frames/*.webp
 *   render/contact-sheet/splats.png    — from render/splat-renders/*.png
 *                                         (run capture-splats.ts first)
 *
 * Grid: 16 cols x 15 rows (240 cells, 237 used, 3 empty).
 * Cell: 480 x 207 px (preserves 3754x1618 ≈ 2.32:1 native aspect).
 * Sheet: 7680 x 3105 px.
 */
import sharp from 'sharp';
import { mkdir, access, constants } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');

const COLS = 16;
const ROWS = 15;
const CELL_W = 480;
const CELL_H = 207;
const SHEET_W = COLS * CELL_W; // 7680
const SHEET_H = ROWS * CELL_H; // 3105
const N = 237;

const FRAMES_DIR = join(REPO_ROOT, 'frontend', 'public', 'frames');
const SPLATS_DIR = join(REPO_ROOT, 'render', 'splat-renders');
const OUT_DIR = join(REPO_ROOT, 'render', 'contact-sheet');

const pad3 = (i: number) => String(i).padStart(3, '0');

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function buildSheet(
  srcPaths: string[],
  outPath: string,
  label: string,
): Promise<void> {
  console.log(`Building ${label} → ${outPath}`);
  const tiles = await Promise.all(
    srcPaths.map(async (p, i) => ({
      input: await sharp(p)
        .resize(CELL_W, CELL_H, { fit: 'fill' })
        .toBuffer(),
      left: (i % COLS) * CELL_W,
      top: Math.floor(i / COLS) * CELL_H,
    })),
  );
  await sharp({
    create: {
      width: SHEET_W,
      height: SHEET_H,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(tiles)
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  done (${SHEET_W}x${SHEET_H})`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const originalPaths = Array.from(
    { length: N },
    (_, i) => join(FRAMES_DIR, `${pad3(i)}.webp`),
  );
  const splatPaths = Array.from(
    { length: N },
    (_, i) => join(SPLATS_DIR, `${pad3(i)}.png`),
  );

  for (const p of originalPaths) {
    if (!(await fileExists(p))) {
      throw new Error(`Missing original frame: ${p}`);
    }
  }
  await buildSheet(originalPaths, join(OUT_DIR, 'original.png'), 'original');

  const splatsAvailable = await fileExists(splatPaths[0]);
  if (!splatsAvailable) {
    console.warn(
      `\nSkipping splat sheet: ${splatPaths[0]} not found.\n` +
        `Run \`bun run capture-splats\` first.`,
    );
    return;
  }
  for (const p of splatPaths) {
    if (!(await fileExists(p))) {
      throw new Error(`Missing splat render: ${p}`);
    }
  }
  await buildSheet(splatPaths, join(OUT_DIR, 'splats.png'), 'splats');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
