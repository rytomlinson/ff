import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ff/common': path.resolve(__dirname, '../common/src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/trpc': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4001',
        ws: true,
      },
    },
  },
});
