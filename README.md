# Bullet Time Online

Reconstructed bullet time scene from The Matrix, rendered as a Gaussian splat with reverse-engineered camera data.

## Stack

- **Viewer**: [PlayCanvas Engine](https://playcanvas.com/) with `GSplatComponent` — loads `.sog` (Spatially Ordered Gaussians), PlayCanvas's super-compressed splat format (~90% smaller than raw PLY)
- **Data pipeline**: Vite plugin in `vite.config.ts` — parses COLMAP binary camera/image files to JSON, converts the source `.ply` splat to `.sog` via [`@playcanvas/splat-transform`](https://github.com/playcanvas/splat-transform) (WebGPU, outlier filter, full SH3)
- **Frontend build**: Vite + TypeScript + Tailwind

## Data flow

```
reconstruction-data/colmap/{cameras,images}.bin
  → vite plugin (buildStart)
  → frontend/src/data/postshot-colmap.json   (camera poses, intrinsics)

reconstruction-data/splats/bullet-time.ply   (23 MB, raw Gaussian splat)
  → vite plugin (splat-transform --filter-sphere, WebGPU k-means)
  → frontend/public/splats/bullet-time.sog   (~3 MB, SOG format)
```

Both outputs are committed so the pipeline only re-runs when sources change (timestamp check).

## Setup

```bash
cd frontend
bun install
bun dev
```
