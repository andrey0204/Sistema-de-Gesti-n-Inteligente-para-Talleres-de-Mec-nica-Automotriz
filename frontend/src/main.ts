import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { setSessionExpiredHandler } from './lib/http'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)

// Pinia debe registrarse antes que el router: los guards usan el store de auth.
app.use(createPinia())
app.use(router)

// Si el refresh token caduca, se cierra la sesión y se vuelve al login.
setSessionExpiredHandler(() => {
  useAuthStore().clearSession()
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
})

app.mount('#app')
