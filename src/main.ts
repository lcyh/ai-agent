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
import 'ant-design-vue/dist/reset.css'
import './index.css'
import './assets/styles/index.scss'
import 'highlight.js/styles/github.css'
import './assets/styles/code.css'
import './assets/styles/markdown.css'

const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(Antd)

app.mount('#app')
