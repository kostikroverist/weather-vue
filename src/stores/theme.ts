import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { readJson, writeJson } from '@/utils/storage'

export type ThemeMode = 'auto' | 'light' | 'dark'

const STORAGE_KEY = 'weather:theme'
const DAYLIGHT_KEY = 'weather:daylight'

const isThemeMode = (v: unknown): v is ThemeMode => v === 'auto' || v === 'light' || v === 'dark'

const isBoolean = (v: unknown): v is boolean => typeof v === 'boolean'

const systemDaylight = (): boolean =>
  typeof matchMedia === 'function' ? !matchMedia('(prefers-color-scheme: dark)').matches : true

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(readJson(STORAGE_KEY, isThemeMode, 'auto'))
  const daylight = ref(readJson(DAYLIGHT_KEY, isBoolean, systemDaylight()))

  const resolved = computed<'light' | 'dark'>(() => {
    if (mode.value === 'auto') return daylight.value ? 'light' : 'dark'
    return mode.value
  })

  function setMode(value: ThemeMode): void {
    mode.value = value
  }

  function setDaylight(value: boolean): void {
    daylight.value = value
  }

  watch(mode, (v) => writeJson(STORAGE_KEY, v))
  watch(daylight, (v) => writeJson(DAYLIGHT_KEY, v))
  watch(
    resolved,
    (v) => {
      document.documentElement.dataset.theme = v
    },
    { immediate: true },
  )

  return { mode, daylight, resolved, setMode, setDaylight }
})
