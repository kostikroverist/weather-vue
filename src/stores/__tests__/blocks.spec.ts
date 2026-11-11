import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { BLOCKS_MAX, useBlocksStore } from '@/stores/blocks'
import { getCityByIp } from '@/services/ip.service'
import { KYIV } from '@/utils/city'
import type { City } from '@/types/city'

vi.mock('@/services/ip.service', () => ({ getCityByIp: vi.fn<() => Promise<City | null>>() }))

const STORAGE_KEY = 'weather:blocks'

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function freshStore() {
  setActivePinia(createPinia())
  return useBlocksStore()
}

describe('blocks store', () => {
  beforeEach(() => {
    vi.mocked(getCityByIp).mockReset()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('without saved blocks starts with one empty block and determines the city', () => {
    const store = useBlocksStore()
    expect(store.blocks).toHaveLength(1)
    expect(store.blocks[0]?.city).toBeNull()
    expect(store.locating).toBe(true)
  })

  it('add creates an empty block', () => {
    const store = useBlocksStore()
    store.add()
    expect(store.blocks).toHaveLength(2)
    expect(store.blocks[1]?.city).toBeNull()
    expect(store.blocks[1]?.id).not.toBe(store.blocks[0]?.id)
  })

  it('after 5 blocks canAdd === false and add does nothing', () => {
    const store = useBlocksStore()
    for (let i = 1; i < BLOCKS_MAX; i++) store.add()
    expect(store.blocks).toHaveLength(5)
    expect(store.canAdd).toBe(false)
    store.add()
    expect(store.blocks).toHaveLength(5)
  })

  it('with one block canRemove === false and remove does nothing', () => {
    const store = useBlocksStore()
    expect(store.canRemove).toBe(false)
    store.remove(store.blocks[0]!.id)
    expect(store.blocks).toHaveLength(1)
  })

  it('remove deletes a block when there is more than one', () => {
    const store = useBlocksStore()
    store.add()
    const [first, second] = store.blocks
    store.remove(second!.id)
    expect(store.blocks.map((b) => b.id)).toEqual([first!.id])
  })

  it('setCity changes the city of this block only', () => {
    const store = useBlocksStore()
    store.add()
    store.setCity(store.blocks[1]!.id, LVIV)
    expect(store.blocks[0]?.city).toBeNull()
    expect(store.blocks[1]?.city).toEqual(LVIV)
  })

  it('initFromIp puts the IP city into the first block', async () => {
    vi.mocked(getCityByIp).mockResolvedValue(LVIV)
    const store = useBlocksStore()
    await store.initFromIp()
    expect(store.blocks[0]?.city).toEqual(LVIV)
    expect(store.locating).toBe(false)
  })

  it('initFromIp without a city sets Kyiv', async () => {
    vi.mocked(getCityByIp).mockResolvedValue(null)
    const store = useBlocksStore()
    await store.initFromIp()
    expect(store.blocks[0]?.city).toEqual(KYIV)
    expect(store.locating).toBe(false)
  })

  it('initFromIp does not touch a city the user has already chosen', async () => {
    vi.mocked(getCityByIp).mockResolvedValue(LVIV)
    const store = useBlocksStore()
    store.setCity(store.blocks[0]!.id, KYIV)
    await store.initFromIp()
    expect(store.blocks[0]?.city).toEqual(KYIV)
  })

  it('initFromIp does not touch a block after the first one is removed', async () => {
    vi.mocked(getCityByIp).mockResolvedValue(LVIV)
    const store = useBlocksStore()
    store.add()
    store.remove(store.blocks[0]!.id)
    await store.initFromIp()
    expect(store.blocks[0]?.city).toBeNull()
  })

  it('initFromIp calls getCityByIp only once', async () => {
    vi.mocked(getCityByIp).mockResolvedValue(null)
    const store = useBlocksStore()
    await Promise.all([store.initFromIp(), store.initFromIp()])
    await store.initFromIp()
    expect(getCityByIp).toHaveBeenCalledTimes(1)
  })

  it('saves blocks to localStorage and restores them after a reload', async () => {
    const store = useBlocksStore()
    store.setCity(store.blocks[0]!.id, LVIV)
    store.add()
    await nextTick()
    const restored = freshStore()
    expect(restored.blocks).toHaveLength(2)
    expect(restored.blocks[0]?.city).toEqual(LVIV)
    expect(restored.blocks[1]?.city).toBeNull()
    expect(restored.locating).toBe(false)
  })

  it('does not determine the city by IP when blocks are saved', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'a', city: LVIV }]))
    const store = freshStore()
    await store.initFromIp()
    expect(getCityByIp).not.toHaveBeenCalled()
    expect(store.blocks[0]?.city).toEqual(LVIV)
  })

  it('corrupted saved blocks are ignored', () => {
    for (const raw of ['{broken', '[]', '[{"id":1,"city":null}]', '{"a":1}']) {
      localStorage.setItem(STORAGE_KEY, raw)
      const store = freshStore()
      expect(store.blocks).toHaveLength(1)
      expect(store.blocks[0]?.city).toBeNull()
      expect(store.locating).toBe(true)
    }
  })

  it('setCity of the first block during IP lookup clears locating and is not overwritten', async () => {
    const ip = deferred<City | null>()
    vi.mocked(getCityByIp).mockReturnValue(ip.promise)
    const store = useBlocksStore()
    const pending = store.initFromIp()
    store.setCity(store.blocks[0]!.id, KYIV)
    expect(store.locating).toBe(false)
    ip.resolve(LVIV)
    await pending
    expect(store.blocks[0]?.city).toEqual(KYIV)
    expect(store.locating).toBe(false)
  })

  it('does not write to localStorage while the city is determined by IP', async () => {
    const ip = deferred<City | null>()
    vi.mocked(getCityByIp).mockReturnValue(ip.promise)
    const store = useBlocksStore()
    const pending = store.initFromIp()
    store.add()
    await nextTick()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    ip.resolve(LVIV)
    await pending
    await nextTick()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual([
      { id: store.blocks[0]!.id, city: LVIV },
      { id: store.blocks[1]!.id, city: null },
    ])
  })

  it('saves state after IP lookup even if the first block was removed during it', async () => {
    const ip = deferred<City | null>()
    vi.mocked(getCityByIp).mockReturnValue(ip.promise)
    const store = useBlocksStore()
    const pending = store.initFromIp()
    store.add()
    store.remove(store.blocks[0]!.id)
    ip.resolve(LVIV)
    await pending
    await nextTick()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual([
      { id: store.blocks[0]!.id, city: null },
    ])
  })

  it('blocks with duplicate ids are considered corrupted', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: 'a', city: LVIV },
        { id: 'a', city: null },
      ]),
    )
    const store = freshStore()
    expect(store.blocks).toHaveLength(1)
    expect(store.blocks[0]?.city).toBeNull()
    expect(store.locating).toBe(true)
  })

  it('add creates unique ids without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {})
    try {
      const store = useBlocksStore()
      store.add()
      store.add()
      const ids = store.blocks.map((b) => b.id)
      expect(new Set(ids).size).toBe(3)
      for (const id of ids) expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  describe('cross-tab synchronization', () => {
    afterEach(() => {
      localStorage.clear()
    })

    it('rereads blocks from a storage event of its own key', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'a', city: null }]))
      const store = freshStore()
      const next = JSON.stringify([
        { id: 'a', city: LVIV },
        { id: 'b', city: null },
      ])
      localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }))
      expect(store.blocks.map((b) => b.id)).toEqual(['a', 'b'])
      expect(store.blocks[0]?.city).toEqual(LVIV)
    })

    it('ignores foreign keys and corrupted data', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: 'a', city: LVIV }]))
      const store = freshStore()
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '[]' }))
      localStorage.setItem(STORAGE_KEY, '{broken')
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{broken' }))
      expect(store.blocks).toEqual([{ id: 'a', city: LVIV }])
    })

    it('blocks from another tab during IP lookup are not overwritten by the IP city', async () => {
      const ip = deferred<City | null>()
      vi.mocked(getCityByIp).mockReturnValue(ip.promise)
      const store = useBlocksStore()
      const pending = store.initFromIp()
      const next = JSON.stringify([{ id: 'x', city: null }])
      localStorage.setItem(STORAGE_KEY, next)
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: next }))
      expect(store.locating).toBe(false)
      ip.resolve(LVIV)
      await pending
      expect(store.blocks).toEqual([{ id: 'x', city: null }])
    })
  })
})
