import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['santa_catalina_logo.jpg', 'favicon.svg'],
      manifest: {
        name: 'Casino de Oficiales',
        short_name: 'Casino Oficiales',
        description: 'Aplicación de gestión del Casino de Oficiales',
        theme_color: '#198754',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'santa_catalina_logo.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: 'santa_catalina_logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
