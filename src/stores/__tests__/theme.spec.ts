import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '../theme'

const KEY = 'weather:theme'

describe('theme store', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    setActivePinia(createPinia())
  })

  it('auto + daylight -> light', () => {
    const store = useThemeStore()
    store.setDaylight(true)
    expect(store.mode).toBe('auto')
    expect(store.resolved).toBe('light')
  })

  it('auto + night -> dark', () => {
    const store = useThemeStore()
    store.setDaylight(false)
    expect(store.resolved).toBe('dark')
  })

  it('manual mode overrides daylight', () => {
    const store = useThemeStore()
    store.setDaylight(false)
    store.setMode('light')
    expect(store.resolved).toBe('light')
    store.setDaylight(true)
    store.setMode('dark')
    expect(store.resolved).toBe('dark')
  })

  it('persists mode to localStorage', async () => {
    const store = useThemeStore()
    store.setMode('dark')
    await nextTick()
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify('dark'))
  })

  it('reads saved mode on start', () => {
    localStorage.setItem(KEY, JSON.stringify('dark'))
    expect(useThemeStore().mode).toBe('dark')
  })

  it('falls back to auto on invalid stored value', () => {
    localStorage.setItem(KEY, JSON.stringify('purple'))
    expect(useThemeStore().mode).toBe('auto')
  })

  it('updates data-theme on the root element', async () => {
    const store = useThemeStore()
    expect(document.documentElement.dataset.theme).toBe('light')
    store.setDaylight(false)
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('dark')
    store.setMode('light')
    await nextTick()
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('remembers day or night and starts from the last value', async () => {
    const store = useThemeStore()
    store.setDaylight(false)
    await nextTick()
    expect(localStorage.getItem('weather:daylight')).toBe('false')
    setActivePinia(createPinia())
    const restored = useThemeStore()
    expect(restored.daylight).toBe(false)
    expect(restored.resolved).toBe('dark')
  })

  it('an invalid saved value yields day', () => {
    localStorage.setItem('weather:daylight', '"yes"')
    expect(useThemeStore().daylight).toBe(true)
  })

  describe('without a saved value uses the system theme', () => {
    function mockPrefersDark(dark: boolean) {
      vi.stubGlobal(
        'matchMedia',
        vi.fn((query: string) => ({ matches: dark && query === '(prefers-color-scheme: dark)' })),
      )
    }

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('dark system -> night', () => {
      mockPrefersDark(true)
      const store = useThemeStore()
      expect(store.daylight).toBe(false)
      expect(store.resolved).toBe('dark')
    })

    it('light system -> day', () => {
      mockPrefersDark(false)
      expect(useThemeStore().daylight).toBe(true)
    })

    it('the saved value takes priority over the system', () => {
      mockPrefersDark(true)
      localStorage.setItem('weather:daylight', 'true')
      expect(useThemeStore().daylight).toBe(true)
    })
  })
})
