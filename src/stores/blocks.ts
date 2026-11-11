import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { getCityByIp } from '@/services/ip.service'
import type { City } from '@/types/city'
import { KYIV, isCity } from '@/utils/city'
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
  Array.isArray(v) && v.length > 0 && v.length <= BLOCKS_MAX && v.every(isBlock)

export const useBlocksStore = defineStore('blocks', () => {
  const saved = readJson<WeatherBlockItem[] | null>(STORAGE_KEY, isBlockList, null)

  const blocks = ref<WeatherBlockItem[]>(saved ?? [{ id: crypto.randomUUID(), city: null }])
  const locating = ref(saved === null)

  let firstChanged = false
  let ipRequested = false

  const canAdd = computed(() => blocks.value.length < BLOCKS_MAX)
  const canRemove = computed(() => blocks.value.length > 1)

  function add(): void {
    if (!canAdd.value) return
    blocks.value.push({ id: crypto.randomUUID(), city: null })
  }

  function remove(id: string): void {
    if (!canRemove.value) return
    if (blocks.value[0]?.id === id) firstChanged = true
    blocks.value = blocks.value.filter((block) => block.id !== id)
  }

  function setCity(id: string, city: City): void {
    const block = blocks.value.find((b) => b.id === id)
    if (!block) return
    if (blocks.value[0]?.id === id) firstChanged = true
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

  watch(blocks, (value) => writeJson(STORAGE_KEY, value), { deep: true })

  return { blocks, locating, canAdd, canRemove, add, remove, setCity, initFromIp }
})
