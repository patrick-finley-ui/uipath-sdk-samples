import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy UiPath API requests to avoid CORS issues in local development
      // IMPORTANT: Replace '/your-org' with your actual organization/tenant path
      // The path pattern should match: /{orgName}/{tenantName}/*
      // Example: If your org is 'acme-corp' and tenant is 'production', use '/acme-corp/production'
      // 
      // To find your path:
      // 1. Log into UiPath Cloud
      // 2. Check the URL - it will be like: https://cloud.uipath.com/{orgName}/{tenantName}/...
      // 3. Use that path pattern here (e.g., '/acme-corp/production')
      '/uipathstgss_updated': {
        target: 'https://staging.uipath.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path, // Keep the path as-is
      },
      // Alternative: If your org/tenant path is different, add additional proxy rules
      // Uncomment and modify the path below to match your actual organization structure
      // '/uipathlabs': {
      //   target: 'https://cloud.uipath.com',
      //   changeOrigin: true,
      //   secure: true,
      // },
    },
  },
})
