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
  css: {
    preprocessorOptions: {
      scss: {
        // 全局注入变量文件，这样所有组件中都可以使用变量，无需导入
        additionalData: '@use "@/assets/styles/variables" as *;'
      }
    }
  },
  server: {
    host: true, // 监听所有地址，包括局域网和公网地址
    port: 5000, // 指定端口号
    open: true, // 自动打开浏览器
    cors: true, // 允许跨域
    strictPort: false, // 端口被占用时，自动尝试下一个可用端口
    // 在终端中显示服务器地址
    hmr: {
      overlay: true
    }
  }
})
