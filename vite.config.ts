import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {  // 配置别名
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  base: './', // 确保使用相对路径
  build: {
    assetsDir: 'assets',
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          echarts: ['echarts', 'echarts-for-react']
        }
      }
    }
  },
  server: {
    open: true,
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://10.1.1.100:8082', // 后端服务实际地址
        changeOrigin: true
      }
    }
  }
})
