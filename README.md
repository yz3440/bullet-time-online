# Bullet Time Online

Reconstructing the bullet time scene from The Matrix as a Gaussian splat, using reverse-engineered camera data from the original footage.

## Project structure

```
original-frames/          Raw frames extracted from the Blu-ray
bluray-images/            Image processing pipeline (crop, resize, center)
reconstruction-data/
  colmap/                 COLMAP sparse reconstruction output (cameras, images, points)
  splats/                 Source Gaussian splats (.ply)
                            bullet-time.ply       Full scene
                            bullet-time-neo.ply   Neo only (extracted subject)
prepare-data.ts           One-time script to regenerate derived data
frontend/                 Web viewer — see frontend/README.md
```

## Reconstruction pipeline

```
original-frames/*.jpg
  → Postshot / COLMAP
  → reconstruction-data/colmap/{cameras,images,points3D}.bin
  → reconstruction-data/splats/bullet-time.ply
```

## Data preparation

Converts reconstruction data into web-ready formats. Run once after changing source data:

```bash
bun prepare-data.ts
```

This parses COLMAP binaries into camera JSON, converts PLY splats to PlayCanvas SOG format, and converts the original JPG frames to WebP for fast scrubbing. Only regenerates files when sources are newer than outputs.

```
reconstruction-data/colmap/{cameras,images}.bin
  → frontend/src/data/postshot-colmap.json   (camera poses + intrinsics)

reconstruction-data/splats/bullet-time.ply
  → frontend/public/splats/bullet-time.sog   (~3 MB, SOG format)

reconstruction-data/splats/bullet-time-neo.ply   (optional, skipped if absent)
  → frontend/public/splats/bullet-time-neo.sog

original-frames/*.jpg
  → frontend/public/frames/*.webp             (resized + compressed for web)
```

Both derived outputs are committed so the frontend works without re-running the script.

## Disclaimer

The Matrix is a trademark of Warner Bros. Entertainment Inc. The ~10 seconds of source frames used for 3D reconstruction are from a personally owned Blu-ray copy. This is a non-commercial technical project and is not affiliated with or endorsed by Warner Bros.
