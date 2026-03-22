import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
    },
  },
  esbuild: {
    jsxImportSource: 'preact',
  },
  build: {
    target: 'esnext',
  },
});
