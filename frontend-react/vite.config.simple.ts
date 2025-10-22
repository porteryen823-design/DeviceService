import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// 簡化的 Vite 設定檔案
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('./src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 8080,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})