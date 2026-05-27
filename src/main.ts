import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

import App from './App.vue'
import router from './router'

import './assets/styles/main.css'
import './assets/styles/layout.css'
import './assets/styles/auth.css'
import './assets/styles/field-analytics.css'
import './assets/styles/topic-analytics.css'
import './assets/styles/user-tools.css'
import './assets/styles/admin.css'

createApp(App).use(router).mount('#app')
