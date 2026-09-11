import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Eine .env für alles, im Wurzelverzeichnis. Vite reicht davon nur Werte mit
  // VITE_-Präfix an die Oberfläche weiter, die Geheimnisse der API bleiben draussen.
  envDir: '../..',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // Im Entwicklungsbetrieb laufen Web und API auf demselben Origin.
      // Damit funktionieren Session-Cookie und CSRF-Origin-Prüfung ohne CORS.
      '/api': { target: 'http://localhost:4000', changeOrigin: false },
    },
  },
  build: { outDir: 'dist', sourcemap: true },
});
