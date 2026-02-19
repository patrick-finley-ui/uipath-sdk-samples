import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy for UiPath staging environment to avoid CORS issues
      '/uipathlabs': {
        target: 'https://staging.uipath.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
