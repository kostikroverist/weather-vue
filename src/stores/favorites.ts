import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { City } from '@/types/city'
import { isCity } from '@/utils/city'
import { readJson, writeJson } from '@/utils/storage'

export const FAVORITES_MAX = 5

const STORAGE_KEY = 'weather:favorites'

const isCityList = (v: unknown): v is City[] => Array.isArray(v) && v.every(isCity)

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<City[]>(readJson(STORAGE_KEY, isCityList, []))
  const pendingCity = ref<City | null>(null)

  const count = computed(() => items.value.length)

  function isFavorite(id: string): boolean {
    return items.value.some((c) => c.id === id)
  }

  function toggle(city: City): void {
    if (isFavorite(city.id)) {
      items.value = items.value.filter((c) => c.id !== city.id)
      return
    }
    if (items.value.length >= FAVORITES_MAX) {
      pendingCity.value = city
      return
    }
    items.value.push(city)
  }

  function remove(id: string): void {
    items.value = items.value.filter((c) => c.id !== id)
    const pending = pendingCity.value
    if (pending && items.value.length < FAVORITES_MAX) {
      items.value.push(pending)
      pendingCity.value = null
    }
  }

  function cancelPending(): void {
    pendingCity.value = null
  }

  watch(items, (v) => writeJson(STORAGE_KEY, v), { deep: true })

  return { items, pendingCity, count, isFavorite, toggle, remove, cancelPending }
})
