import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/pptx': 'http://localhost:8000',
      '/generate': 'http://localhost:8000',
      '/estimate': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/ai-detect': 'http://localhost:8000',
      '/generation': 'http://localhost:8000',
      '/report': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // Prevent proxy from timing out or buffering SSE connections
        proxyTimeout: 300000,
        timeout: 300000,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['x-accel-buffering'] = 'no'
            proxyRes.headers['cache-control'] = 'no-cache'
          })
        },
      },
    }
  }
})
