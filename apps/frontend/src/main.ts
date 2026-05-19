import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 浩煜设计系统
import './styles/tokens.scss'
import './styles/effects.scss'
import './styles/theme.scss'
import './styles/form-controls.scss'
import './style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 全局错误捕获 — 排查 P0 空白页/404
app.config.errorHandler = (err, _instance, info) => {
  console.error('[Vue Error]', info, err)
}

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

router.isReady().then(() => {
  app.mount('#app')
  console.log('[Haoyu] App mounted, route:', router.currentRoute.value.path)
}).catch((err) => {
  console.error('[Haoyu] Router init failed:', err)
  // 兜底：仍然尝试挂载
  app.mount('#app')
})
