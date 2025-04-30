/*
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: true, // 监听所有地址，包括局域网和公网地址
    port: 3000, // 指定端口号
    open: true, // 自动打开浏览器
    cors: true, // 允许跨域
    strictPort: false, // 端口被占用时，自动尝试下一个可用端口
    // 在终端中显示服务器地址
    hmr: {
      overlay: true
    }
  }
})
