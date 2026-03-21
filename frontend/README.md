# Bullet Time — Web Viewer

Interactive Gaussian splat viewer for the reconstructed bullet time scene.

## Stack

- **Renderer**: [PlayCanvas Engine](https://playcanvas.com/) with `GSplatComponent` — loads `.sog` (Spatially Ordered Gaussians), PlayCanvas's super-compressed splat format (~90% smaller than raw PLY)
- **Data pipeline**: Vite plugin (`scripts/prepare-data-plugin.ts`) — parses COLMAP binary camera/image files to JSON, converts the source `.ply` to `.sog` via [`@playcanvas/splat-transform`](https://github.com/playcanvas/splat-transform)
- **Build**: Vite + TypeScript + Tailwind

## Setup

```bash
bun install
bun dev
```

## Data flow

The Vite plugin runs at `buildStart` and regenerates derived files only when sources are newer (timestamp check). If `reconstruction-data/` is missing, it skips and uses the already-committed outputs.

```
reconstruction-data/colmap/{cameras,images}.bin
  → scripts/parse-colmap.ts
  → src/data/postshot-colmap.json

reconstruction-data/splats/bullet-time.ply
  → splat-transform CLI (WebGPU, --filter-sphere, SH3)
  → public/splats/bullet-time.sog
```
