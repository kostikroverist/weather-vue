import { ref, watch } from 'vue'
import { readJson, writeJson } from '@/utils/storage'
import { en } from './en'
import { uk } from './uk'

export type MessageKey = keyof typeof uk
export type Locale = 'uk' | 'en'

export const LOCALES: readonly Locale[] = ['uk', 'en']

const STORAGE_KEY = 'weather:locale'

const messages: Record<Locale, Record<MessageKey, string>> = { uk, en }

export function isLocale(v: unknown): v is Locale {
  return LOCALES.some((l) => l === v)
}

export const locale = ref<Locale>(readJson(STORAGE_KEY, isLocale, 'uk'))

watch(
  locale,
  (value) => {
    writeJson(STORAGE_KEY, value)
    document.documentElement.lang = value
    document.title = t('app.title')
  },
  { immediate: true },
)

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  const template = messages[locale.value][key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  )
}

export function weekdayName(day: number): string {
  return t(`weekday.${day}` as MessageKey)
}

export function monthName(month: number): string {
  return t(`month.${month}` as MessageKey)
}

const NUMBER_LOCALES: Record<Locale, string> = { uk: 'uk-UA', en: 'en-US' }

export function formatNumber(value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat(NUMBER_LOCALES[locale.value], {
    maximumFractionDigits: maxFractionDigits,
  }).format(value)
}

const TIME_LOCALES: Record<Locale, string> = { uk: 'uk-UA', en: 'en-GB' }

export function formatTime(ts: number): string {
  return new Intl.DateTimeFormat(TIME_LOCALES[locale.value], {
    hour: '2-digit',
    minute: '2-digit',
  }).format(ts)
}

export function apiLang(): 'ua' | 'en' {
  return locale.value === 'uk' ? 'ua' : 'en'
}
