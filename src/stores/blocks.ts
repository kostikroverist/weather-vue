import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { getCityByIp } from '@/services/ip.service'
import type { City } from '@/types/city'
import { KYIV, isCity } from '@/utils/city'
import { newId } from '@/utils/id'
import { readJson, writeJson } from '@/utils/storage'

export const BLOCKS_MAX = 5

const STORAGE_KEY = 'weather:blocks'

export interface WeatherBlockItem {
  id: string
  city: City | null
}

const isBlock = (v: unknown): v is WeatherBlockItem =>
  typeof v === 'object' &&
  v !== null &&
  'id' in v &&
  typeof v.id === 'string' &&
  'city' in v &&
  (v.city === null || isCity(v.city))

const isBlockList = (v: unknown): v is WeatherBlockItem[] =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.length <= BLOCKS_MAX &&
  v.every(isBlock) &&
  new Set(v.map((block) => block.id)).size === v.length

export const useBlocksStore = defineStore('blocks', () => {
  const saved = readJson<WeatherBlockItem[] | null>(STORAGE_KEY, isBlockList, null)

  const blocks = ref<WeatherBlockItem[]>(saved ?? [{ id: newId(), city: null }])
  const locating = ref(saved === null)

  let firstChanged = false
  let ipRequested = false

  const canAdd = computed(() => blocks.value.length < BLOCKS_MAX)
  const canRemove = computed(() => blocks.value.length > 1)

  function add(): void {
    if (!canAdd.value) return
    blocks.value.push({ id: newId(), city: null })
  }

  function remove(id: string): void {
    if (!canRemove.value) return
    if (blocks.value[0]?.id === id) firstChanged = true
    blocks.value = blocks.value.filter((block) => block.id !== id)
  }

  function setCity(id: string, city: City): void {
    const block = blocks.value.find((b) => b.id === id)
    if (!block) return
    if (blocks.value[0]?.id === id) {
      firstChanged = true
      locating.value = false
    }
    block.city = city
  }

  async function initFromIp(): Promise<void> {
    if (!locating.value || ipRequested) return
    ipRequested = true
    const city = await getCityByIp()
    const first = blocks.value[0]
    if (first && !firstChanged && first.city === null) first.city = city ?? KYIV
    locating.value = false
  }

  function onStorage(event: StorageEvent): void {
    if (event.key !== STORAGE_KEY) return
    const next = readJson<WeatherBlockItem[] | null>(STORAGE_KEY, isBlockList, null)
    if (!next) return
    firstChanged = true
    locating.value = false
    blocks.value = next
  }

  watch(
    [blocks, locating],
    () => {
      if (!locating.value) writeJson(STORAGE_KEY, blocks.value)
    },
    { deep: true },
  )

  window.addEventListener('storage', onStorage)
  onScopeDispose(() => window.removeEventListener('storage', onStorage))

  return { blocks, locating, canAdd, canRemove, add, remove, setCity, initFromIp }
})
