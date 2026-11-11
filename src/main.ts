import './styles/reset.css'
import './styles/tokens.css'
import './styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const RELOAD_KEY = 'weather:reloaded'

window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem(RELOAD_KEY)) return
    sessionStorage.setItem(RELOAD_KEY, '1')
  } catch {
    return
  }
  window.location.reload()
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
