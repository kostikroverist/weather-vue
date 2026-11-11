import axios from 'axios'
import { apiLang } from '@/i18n'

export const http = axios.create({ baseURL: 'https://api.openweathermap.org' })

http.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    appid: import.meta.env.VITE_OWM_KEY,
    units: 'metric',
    lang: apiLang(),
  }
  return config
})
