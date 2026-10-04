import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — статический билд открывается с file:// и пакуется в ZIP для Яндекс Игр
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', assetsInlineLimit: 4096, chunkSizeWarningLimit: 900 },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
} as any);
