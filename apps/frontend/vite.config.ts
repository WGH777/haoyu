import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      // 🔥 核心修复：告诉 Vite，遇到 @ 就去找 src 目录
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})