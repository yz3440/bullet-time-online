import { defineConfig } from 'vite';
import path from 'path';
import { prepareData } from './scripts/prepare-data-plugin';

export default defineConfig({
  plugins: [prepareData(path.resolve(__dirname, '..'))],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    target: 'esnext',
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
