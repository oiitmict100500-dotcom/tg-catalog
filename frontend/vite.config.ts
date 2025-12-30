import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 3001,
    strictPort: true,
    open: false, // Отключено автоматическое открытие, чтобы избежать двойного открытия
    // Разрешаем все хосты для работы с ngrok (домены меняются при каждом запуске)
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})


