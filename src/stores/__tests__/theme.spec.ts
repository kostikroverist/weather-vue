import { beforeEach, describe, expect, it } from 'vitest'
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

  it('запамʼятовує день чи ніч і стартує з останнього значення', async () => {
    const store = useThemeStore()
    store.setDaylight(false)
    await nextTick()
    expect(localStorage.getItem('weather:daylight')).toBe('false')
    setActivePinia(createPinia())
    const restored = useThemeStore()
    expect(restored.daylight).toBe(false)
    expect(restored.resolved).toBe('dark')
  })

  it('невалідне збережене значення дня дає день', () => {
    localStorage.setItem('weather:daylight', '"yes"')
    expect(useThemeStore().daylight).toBe(true)
  })
})
