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

  it('toggle adds a city, a second toggle removes it', () => {
    const store = useFavoritesStore()
    store.toggle(city(1))
    expect(store.isFavorite(city(1).id)).toBe(true)
    expect(store.count).toBe(1)
    store.toggle(city(1))
    expect(store.isFavorite(city(1).id)).toBe(false)
    expect(store.count).toBe(0)
  })

  it('the sixth city is not added and becomes pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    expect(store.count).toBe(5)
    expect(store.isFavorite(city(6).id)).toBe(false)
    expect(store.pendingCity).toEqual(city(6))
  })

  it('remove with an existing pendingCity adds it and resets pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    store.remove(city(1).id)
    expect(store.isFavorite(city(1).id)).toBe(false)
    expect(store.isFavorite(city(6).id)).toBe(true)
    expect(store.count).toBe(5)
    expect(store.pendingCity).toBeNull()
  })

  it('cancelPending resets pendingCity', () => {
    const store = useFavoritesStore()
    for (let i = 1; i <= FAVORITES_MAX; i++) store.toggle(city(i))
    store.toggle(city(6))
    store.cancelPending()
    expect(store.pendingCity).toBeNull()
    expect(store.count).toBe(5)
  })

  it('saves the list to localStorage after a change', async () => {
    const store = useFavoritesStore()
    store.toggle(city(1))
    store.toggle(city(2))
    await nextTick()
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify([city(1), city(2)]))
  })

  it('reads a valid list from localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify([city(1)]))
    expect(useFavoritesStore().items).toEqual([city(1)])
  })

  it.each([
    '{broken',
    '[{"id":1}]',
    '{"a":1}',
    JSON.stringify([city(1), city(1)]),
    JSON.stringify([1, 2, 3, 4, 5, 6].map(city)),
  ])('corrupted localStorage %s yields []', (raw) => {
    localStorage.setItem(KEY, raw)
    expect(useFavoritesStore().items).toEqual([])
  })

  it('rereads favorites from a storage event of its own key', () => {
    const store = useFavoritesStore()
    const next = JSON.stringify([city(2), city(3)])
    localStorage.setItem(KEY, next)
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: next }))
    expect(store.items).toEqual([city(2), city(3)])
  })

  it('a storage event with corrupted data yields [], a foreign key is ignored', () => {
    localStorage.setItem(KEY, JSON.stringify([city(1)]))
    const store = useFavoritesStore()
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '[]' }))
    expect(store.items).toEqual([city(1)])
    localStorage.setItem(KEY, '{broken')
    window.dispatchEvent(new StorageEvent('storage', { key: KEY, newValue: '{broken' }))
    expect(store.items).toEqual([])
  })
})
