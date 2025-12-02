import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      path: 'path-browserify',
    },
  },
  optimizeDeps: {
    include: ['@uipath/uipath-typescript'],
  },
  server: {
     proxy: {
    '/uipathlabs': {
      target: 'https://staging.uipath.com',
      changeOrigin: true,
      secure: true,
    },
  },
  }
})
