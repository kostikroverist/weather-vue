import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { City } from '@/types/city'
import { KYIV } from '@/utils/city'

export const BLOCKS_MAX = 5

export interface WeatherBlockItem {
  id: string
  city: City | null
}

export const useBlocksStore = defineStore('blocks', () => {
  const blocks = ref<WeatherBlockItem[]>([{ id: crypto.randomUUID(), city: KYIV }])

  const canAdd = computed(() => blocks.value.length < BLOCKS_MAX)
  const canRemove = computed(() => blocks.value.length > 1)

  function add(): void {
    if (!canAdd.value) return
    blocks.value.push({ id: crypto.randomUUID(), city: null })
  }

  function remove(id: string): void {
    if (!canRemove.value) return
    blocks.value = blocks.value.filter((block) => block.id !== id)
  }

  function setCity(id: string, city: City): void {
    const block = blocks.value.find((b) => b.id === id)
    if (block) block.city = city
  }

  return { blocks, canAdd, canRemove, add, remove, setCity }
})
