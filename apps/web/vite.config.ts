import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-core',
              test: /node_modules[\\/](?:react|react-dom|react-router|scheduler)[\\/]/,
              priority: 20,
            },
            {
              name: 'data-and-forms',
              test: /node_modules[\\/](?:@tanstack|@hookform|react-hook-form|zod)[\\/]/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: process.env.VITE_API_PROXY_ORIGIN
      ? { '/api': { target: process.env.VITE_API_PROXY_ORIGIN, changeOrigin: false } }
      : undefined,
  },
  preview: { port: 4173, strictPort: true },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: { reporter: ['text', 'json-summary'] },
  },
});
