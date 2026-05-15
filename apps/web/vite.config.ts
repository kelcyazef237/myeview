import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/v1/discovery': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true,
      },
      '/api/v1/verification': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/v1/enrichment': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/v1/scoring': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/api/v1/graph': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/v1/compliance': {
        target: 'http://localhost:8086',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
