import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { BLOCKS_MAX, useBlocksStore } from '@/stores/blocks'
import { KYIV } from '@/utils/city'
import type { City } from '@/types/city'

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

describe('blocks store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('стартує з одним блоком з Києвом', () => {
    const store = useBlocksStore()
    expect(store.blocks).toHaveLength(1)
    expect(store.blocks[0]?.city).toEqual(KYIV)
  })

  it('add створює порожній блок', () => {
    const store = useBlocksStore()
    store.add()
    expect(store.blocks).toHaveLength(2)
    expect(store.blocks[1]?.city).toBeNull()
    expect(store.blocks[1]?.id).not.toBe(store.blocks[0]?.id)
  })

  it('після 5 блоків canAdd === false і add нічого не робить', () => {
    const store = useBlocksStore()
    for (let i = 1; i < BLOCKS_MAX; i++) store.add()
    expect(store.blocks).toHaveLength(5)
    expect(store.canAdd).toBe(false)
    store.add()
    expect(store.blocks).toHaveLength(5)
  })

  it('з одним блоком canRemove === false і remove нічого не робить', () => {
    const store = useBlocksStore()
    expect(store.canRemove).toBe(false)
    store.remove(store.blocks[0]!.id)
    expect(store.blocks).toHaveLength(1)
  })

  it('remove видаляє блок, коли блоків більше одного', () => {
    const store = useBlocksStore()
    store.add()
    const [first, second] = store.blocks
    store.remove(second!.id)
    expect(store.blocks.map((b) => b.id)).toEqual([first!.id])
  })

  it('setCity змінює місто тільки цього блоку', () => {
    const store = useBlocksStore()
    store.add()
    store.setCity(store.blocks[1]!.id, LVIV)
    expect(store.blocks[0]?.city).toEqual(KYIV)
    expect(store.blocks[1]?.city).toEqual(LVIV)
  })
})
