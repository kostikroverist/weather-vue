import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { FAVORITES_MAX, useFavoritesStore } from '@/stores/favorites'
import type { City } from '@/types/city'

const city = (n: number): City => ({
  id: `${n}.00,${n}.00`,
  names: { uk: `Місто ${n}`, en: `City ${n}` },
  country: 'UA',
  lat: n,
  lon: n,
})

const KEY = 'weather:favorites'

describe('favorites store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('toggle додає місто, повторний toggle прибирає', () => {
    const store = useFavoritesStore()
    store.toggle(city(1))
    expect(store.isFavorite(city(1).id)).toBe(true)
    expect(store.count).toBe(1)
    store.toggle(city(1))
    expect(store.isFavorite(city(1).id)).toBe(false)
    expect(store.count).toBe(0)
  })

  it('шосте місто не додається, а стає pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    expect(store.count).toBe(5)
    expect(store.isFavorite(city(6).id)).toBe(false)
    expect(store.pendingCity).toEqual(city(6))
  })

  it('remove при наявному pendingCity додає його і обнуляє pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    store.remove(city(1).id)
    expect(store.isFavorite(city(1).id)).toBe(false)
    expect(store.isFavorite(city(6).id)).toBe(true)
    expect(store.count).toBe(5)
    expect(store.pendingCity).toBeNull()
  })

  it('cancelPending обнуляє pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    store.cancelPending()
    expect(store.pendingCity).toBeNull()
    expect(store.count).toBe(5)
  })

  it('після зміни зберігає список у localStorage', async () => {
    const store = useFavoritesStore()
    store.toggle(city(1))
    store.toggle(city(2))
    await nextTick()
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify([city(1), city(2)]))
  })

  it('читає валідний список з localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify([city(1)]))
    expect(useFavoritesStore().items).toEqual([city(1)])
  })

  it.each([
    '{broken',
    '[{"id":1}]',
    '{"a":1}',
    JSON.stringify([city(1), city(1)]),
    JSON.stringify([1, 2, 3, 4, 5, 6].map(city)),
  ])('пошкоджений localStorage %s дає []', (raw) => {
    localStorage.setItem(KEY, raw)
    expect(useFavoritesStore().items).toEqual([])
  })

  it('перечитує обране з події storage свого ключа', () => {
    const store = useFavoritesStore()
    const next = JSON.stringify([city(2), city(3)])
    localStorage.setItem(KEY, next)
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: next }))
    expect(store.items).toEqual([city(2), city(3)])
  })

  it('подія storage з пошкодженими даними дає [], чужий ключ ігнорується', () => {
    localStorage.setItem(KEY, JSON.stringify([city(1)]))
    const store = useFavoritesStore()
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '[]' }))
    expect(store.items).toEqual([city(1)])
    localStorage.setItem(KEY, '{broken')
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '{broken' }))
    expect(store.items).toEqual([])
  })
})
