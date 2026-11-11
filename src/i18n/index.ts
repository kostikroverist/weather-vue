import { ref } from 'vue'
import { uk } from './uk'

export type MessageKey = keyof typeof uk
export type Locale = 'uk' | 'en'

const messages: Partial<Record<Locale, Record<MessageKey, string>>> = { uk }

export const locale = ref<Locale>('uk')

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = (messages[locale.value] ?? uk)[key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export function apiLang(): 'ua' | 'en' {
  return locale.value === 'uk' ? 'ua' : 'en'
}
