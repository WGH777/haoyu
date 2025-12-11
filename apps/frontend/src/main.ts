import { createApp } from 'vue'
import { createPinia } from 'pinia' // 如果你用了 pinia
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 👇 引入图标库
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 👇 自动注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia()) // 如果没装 pinia 可以删掉这行
app.use(router)
app.use(ElementPlus)

app.mount('#app')