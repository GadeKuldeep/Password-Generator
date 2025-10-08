import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ FINAL CONFIG for Vite (works locally + Netlify)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // or 3000, doesn’t matter much
    proxy: {
      '/api': {
        target: 'https://password-generator-z5e8.onrender.com/api', // Local backend (development only)
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  build: {
    outDir: 'dist', // Netlify deploys from this folder
  },
  define: {
    'process.env': {}, // Fixes "process is not defined" issue in browser
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
