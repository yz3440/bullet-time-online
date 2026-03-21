# Bullet Time Online

Reconstructed bullet time scene from The Matrix, rendered as a Gaussian splat with reverse-engineered camera data.

## Stack

- **Viewer**: [PlayCanvas Engine](https://playcanvas.com/) with `GSplatComponent` — loads `.sog` (Spatially Ordered Gaussians), PlayCanvas's super-compressed splat format (~95% smaller than raw PLY)
- **Data pipeline**: `prepare-data.ts` (run with `bun`) — parses COLMAP binary camera/image files to JSON, converts the source `.ply` splat to `.sog` via [`@playcanvas/splat-transform`](https://github.com/playcanvas/splat-transform)
- **Frontend build**: Vite + TypeScript + Tailwind

## Data flow

```
reconstruction-data/colmap/{cameras,images}.bin
  → prepare-data.ts
  → frontend/src/data/postshot-colmap.json   (camera poses, intrinsics)

reconstruction-data/splats/bullet-time.ply   (23 MB, raw Gaussian splat)
  → prepare-data.ts (splat-transform via WebGPU, outlier filter, full SH3)
  → frontend/public/splats/bullet-time.sog   (~3 MB, SOG format)
```

## Setup

```bash
# Install root deps (splat-transform CLI)
bun install

# Regenerate frontend data from reconstruction sources (optional — outputs are committed)
bun prepare-data.ts

# Run frontend
cd frontend
bun install
bun dev
```
