
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://kasirpro.thm.my.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/index.php/api'),
        secure: false, // Set false jika menggunakan self-signed SSL/HTTP
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
