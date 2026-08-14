import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
