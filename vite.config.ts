import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node20',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: 'index',
    },
    outDir: 'dist',
    rollupOptions: {
      external: [
        'express',
        'cors',
        'helmet',
        'express-rate-limit',
        'bcrypt',
        'jsonwebtoken',
        'nano',
        'winston',
        'fs',
        'path',
        'crypto',
        'http',
      ],
      output: {
        format: 'cjs',
      },
    },
    minify: false,
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
