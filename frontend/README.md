# Bullet Time — Web Viewer

Interactive Gaussian splat viewer for the reconstructed bullet time scene.

## Stack

- **Renderer**: [PlayCanvas Engine](https://playcanvas.com/) with `GSplatComponent` — loads `.sog` (Spatially Ordered Gaussians), PlayCanvas's super-compressed splat format (~90% smaller than raw PLY)
- **Build**: Vite + TypeScript + Tailwind

## Setup

```bash
bun install
bun dev
```

The camera data (`src/data/postshot-colmap.json`) and splat file (`public/splats/bullet-time.sog`) are pre-committed. To regenerate them from source data, run `bun prepare-data.ts` from the repo root.
