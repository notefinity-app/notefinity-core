import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'node20',
    ssr: true,
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
        'bcryptjs',
        'jsonwebtoken',
        'nano',
        'winston',
        'fs',
        'path',
        'crypto',
        'http',
        'joi',
      ],
      output: {
        format: 'cjs',
      },
    },
    minify: false,
    sourcemap: true,
  },
  define: {
    global: 'globalThis',
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
