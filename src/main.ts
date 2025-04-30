import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from './stores'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import './index.css'
import './assets/styles/index.scss'

const app = createApp(App)

app.use(router)
app.use(pinia)
app.use(Antd)

app.mount('#app')
