/**
 * Drives the frontend (in `?capture=1` mode) through all 237 camera poses
 * and saves a PNG render per camera to `render/splat-renders/`.
 *
 * Spawns the Vite dev server unless one is already serving on :5179.
 * Renders at 960x414 (matches 3754x1618 ≈ 2.32:1 source aspect).
 */
import { chromium } from 'playwright';
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as net from 'node:net';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..');
const FRONTEND_DIR = resolve(REPO_ROOT, 'frontend');

const HOST = '127.0.0.1';
const PORT = 5179;
const URL = `http://${HOST}:${PORT}/?capture=1`;
const VIEWPORT = { width: 960, height: 414 };
const OUT_DIR = resolve(REPO_ROOT, 'render', 'splat-renders');

async function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(500);
    sock.once('connect', () => { sock.destroy(); resolve(true); });
    sock.once('timeout', () => { sock.destroy(); resolve(false); });
    sock.once('error', () => resolve(false));
    sock.connect(port, host);
  });
}

async function waitForPort(host: string, port: number, timeoutMs = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isPortOpen(host, port)) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Dev server didn't open ${host}:${port} within ${timeoutMs}ms`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let devServer: ChildProcess | null = null;
  if (!(await isPortOpen(HOST, PORT))) {
    console.log('Starting dev server (cd frontend && bun dev)...');
    devServer = spawn(
      process.execPath,
      ['x', 'vite', '--port', String(PORT), '--strictPort', '--host', HOST],
      {
        cwd: FRONTEND_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      },
    );
    devServer.stdout?.on('data', (b) => process.stdout.write(`[vite] ${b}`));
    devServer.stderr?.on('data', (b) => process.stderr.write(`[vite] ${b}`));
    devServer.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`Dev server exited with code ${code}`);
      }
    });
    await waitForPort(HOST, PORT);
  } else {
    console.log(`Reusing dev server already running on ${HOST}:${PORT}`);
  }

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=swiftshader',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
    ],
  });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  page.on('pageerror', (err) => console.error('[page error]', err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[page console]', msg.text());
  });

  console.log(`Loading ${URL}`);
  await page.goto(URL, { waitUntil: 'load', timeout: 60_000 });

  console.log('Waiting for splat to load...');
  await page.waitForFunction(
    () => (window as any).__captureReady === true,
    null,
    { timeout: 60_000 },
  );

  const N: number = await page.evaluate(() => (window as any).__cameraCount);
  console.log(`Capturing ${N} frames at ${VIEWPORT.width}x${VIEWPORT.height}...`);

  const { writeFile } = await import('node:fs/promises');
  for (let i = 0; i < N; i++) {
    const dataUrl: string = await page.evaluate(async (idx) => {
      await (window as any).__captureFrame(idx);
      const c = document.querySelector('canvas') as HTMLCanvasElement;
      return c.toDataURL('image/png');
    }, i);
    const buf = Buffer.from(dataUrl.split(',', 2)[1], 'base64');
    const path = join(OUT_DIR, `${String(i).padStart(3, '0')}.png`);
    await writeFile(path, buf);
    if (i % 20 === 0 || i === N - 1) {
      console.log(`  ${i + 1}/${N}`);
    }
  }

  await browser.close();
  if (devServer) {
    devServer.kill('SIGTERM');
  }
  console.log(`Done. ${N} renders saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
