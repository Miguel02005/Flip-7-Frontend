import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// El backend Spring Boot expone sus endpoints directamente bajo /games
// (sin prefijo /api). Para evitar el error 404 de CORS en desarrollo,
// el dev server de Vite redirige /games hacia http://localhost:8080.
// El backend no tiene CORS configurado y no se puede modificar.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/games': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 5173,
  },
})
