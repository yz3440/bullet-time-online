# Bullet Time Online

Reconstructing the bullet time scene from The Matrix as a Gaussian splat, using reverse-engineered camera data from the original footage.

## Project structure

```
original-frames/          Raw frames extracted from the Blu-ray
bluray-images/            Image processing pipeline (crop, resize, center)
reconstruction-data/
  colmap/                 COLMAP sparse reconstruction output (cameras, images, points)
  splats/                 Source Gaussian splat (.ply, 23 MB)
frontend/                 Web viewer — see frontend/README.md
```

## Reconstruction pipeline

```
original-frames/*.jpg
  → Postshot / COLMAP
  → reconstruction-data/colmap/{cameras,images,points3D}.bin
  → reconstruction-data/splats/bullet-time.ply

reconstruction-data/colmap/{cameras,images}.bin
  → Vite plugin (parse-colmap.ts)
  → frontend/src/data/postshot-colmap.json   (camera poses + intrinsics)

reconstruction-data/splats/bullet-time.ply
  → Vite plugin (splat-transform, WebGPU k-means, outlier filter, SH3)
  → frontend/public/splats/bullet-time.sog   (~3 MB, SOG format)
```

Both derived outputs are committed so the frontend works without re-running the pipeline.
