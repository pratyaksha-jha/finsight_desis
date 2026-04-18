import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // 1. Python News Service
      '/api/v1/news': { target: 'http://localhost:8001', changeOrigin: true },
      
      // 2. Python Stock Service
      '/api/stock': { target: 'http://localhost:8000', changeOrigin: true },

      // 3. Specific Node backend routes
      '/api/auth': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/parental': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/watchlist': { target: 'http://localhost:3000', changeOrigin: true },
      '/api/comparison': { target: 'http://localhost:3000', changeOrigin: true },

      // 4. Python backend — root level paths
      '/companies': { target: 'http://localhost:8000', changeOrigin: true },
      '/financials': { target: 'http://localhost:8000', changeOrigin: true },
      '/prices': { target: 'http://localhost:8000', changeOrigin: true },
      '/summaries': { target: 'http://localhost:8000', changeOrigin: true },
      '/diversification': { target: 'http://localhost:8000', changeOrigin: true },
      '/leaderboard': { target: 'http://localhost:8000', changeOrigin: true },
      '/seed-portfolio': { target: 'http://localhost:8000', changeOrigin: true },

      // 5. CATCH-ALL
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})