import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  /* 
   * CORS PROXY CONFIGURATION
   * 
   * To enable CORS proxy for local development:
   * 1. Uncomment the server.proxy configuration below
   * 2. Set VITE_USE_CORS_PROXY=true in your .env.development file
   * 3. Restart your dev server (npm run dev)
   * 
   * To disable (default):
   * 1. Keep this configuration commented out
   * 2. Set VITE_USE_CORS_PROXY=false in your .env.development file
   * 3. You may need a CORS browser extension for some API calls
   */
  
  server: {
    proxy: {
      // Proxy all UiPath API requests to avoid CORS issues in local development
      // This catches requests like /uipathlabs/Playground/maestro_/...
      '/uipathlabs': {
        target: 'https://staging.uipath.com',
        changeOrigin: true,
        secure: true,
      },
      // Proxy organization ID paths
      '/82e69757-09ff-4e6d-83e7-d530f2ac4e7b': {
        target: 'https://staging.uipath.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})

