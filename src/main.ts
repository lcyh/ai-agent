/*
 * @Author: changluo
 * @Description: 
 * @LastEditors: luc19964 luochang@gopherasset.com
 */
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import Antd from 'ant-design-vue'

// 导入样式，确保全局样式变量先被加载
import './assets/styles/index.scss'
import 'ant-design-vue/dist/reset.css'
import './index.css'
import 'highlight.js/styles/github.css'
import './assets/styles/code.css'
import './assets/styles/markdown.css'
import './assets/styles/global.scss'

const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(Antd)

app.mount('#app')
