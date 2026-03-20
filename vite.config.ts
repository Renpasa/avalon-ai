import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0', // 監聽所有介面 (包含 IPv4 和 IPv6)
    port: 5175,
    strictPort: true, // 避免 port 被佔用時自動跳轉，方便排查問題
  }
})
