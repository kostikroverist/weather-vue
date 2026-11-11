import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { CanceledError } from 'axios'
import { locale } from '@/i18n'
import { searchCities } from '@/services/geo.service'
import { useCitySearch } from '@/composables/useCitySearch'
import { KYIV } from '@/utils/city'
import type { City } from '@/types/city'

vi.mock('@/services/geo.service')

const mocked = vi.mocked(searchCities)

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

const TAIKKYI: City = {
  id: '17.32,95.97',
  names: { uk: 'Taikkyi', en: 'Taikkyi' },
  country: 'MM',
  lat: 17.3167,
  lon: 95.9667,
}

const RIGA: City = {
  id: '56.95,24.11',
  names: { uk: 'Рига', en: 'Riga' },
  country: 'LV',
  lat: 56.9496,
  lon: 24.1052,
}

const KYOTO: City = {
  id: '35.01,135.77',
  names: { uk: 'Кіото', en: 'Kyoto' },
  country: 'JP',
  lat: 35.0116,
  lon: 135.7681,
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

let scope: EffectScope

function setup() {
  scope = effectScope()
  return scope.run(() => useCitySearch())!
}

describe('useCitySearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocked.mockReset()
    mocked.mockResolvedValue([KYIV])
  })

  afterEach(() => {
    scope.stop()
    locale.value = 'uk'
    vi.useRealTimers()
  })

  it('does not search for a single character', async () => {
    const search = setup()
    search.query.value = 'К'
    await vi.advanceTimersByTimeAsync(300)
    expect(mocked).not.toHaveBeenCalled()
    expect(search.results.value).toEqual([])
  })

  it('waits 300 ms after the last character', async () => {
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(100)
    search.query.value = 'Киї'
    await vi.advanceTimersByTimeAsync(300)
    expect(mocked).toHaveBeenCalledTimes(1)
    expect(mocked.mock.calls[0]?.[0]).toBe('Киї')
    expect(search.results.value).toEqual([KYIV])
    expect(search.loading.value).toBe(false)
  })

  it('shows loading already while waiting for debounce', async () => {
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(100)
    expect(search.loading.value).toBe(true)
    expect(mocked).not.toHaveBeenCalled()
  })

  it('a second search cancels the first', async () => {
    mocked.mockReturnValue(new Promise(() => {}))
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    search.query.value = 'Льв'
    await vi.advanceTimersByTimeAsync(300)
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked.mock.calls[0]?.[1]?.aborted).toBe(true)
    expect(mocked.mock.calls[1]?.[1]?.aborted).toBe(false)
  })

  it('a late response of the first request does not overwrite the second', async () => {
    const first = deferred<City[]>()
    const second = deferred<City[]>()
    mocked.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    search.query.value = 'Льв'
    await vi.advanceTimersByTimeAsync(300)
    second.resolve([LVIV])
    await flushPromises()
    first.resolve([KYIV])
    await flushPromises()
    expect(search.results.value).toEqual([LVIV])
    expect(search.loading.value).toBe(false)
  })

  it('CanceledError after request cancellation does not set error', async () => {
    mocked.mockImplementation(
      (_q, signal) =>
        new Promise<City[]>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(new CanceledError()))
        }),
    )
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    search.query.value = 'Киї'
    await flushPromises()
    expect(search.error.value).toBe(false)
    expect(search.loading.value).toBe(true)
  })

  it('another error sets error', async () => {
    mocked.mockRejectedValue(new Error('network'))
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(search.error.value).toBe(true)
    expect(search.loading.value).toBe(false)
  })

  it('clear resets the query and results', async () => {
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    search.clear()
    await vi.advanceTimersByTimeAsync(300)
    expect(search.query.value).toBe('')
    expect(search.results.value).toEqual([])
    expect(mocked).toHaveBeenCalledTimes(1)
  })

  it('repeats the active search when the language changes', async () => {
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    expect(mocked).toHaveBeenCalledTimes(1)
    const kyivCity = { ...KYIV, state: 'Kyiv City' }
    mocked.mockResolvedValueOnce([kyivCity])
    locale.value = 'en'
    await vi.advanceTimersByTimeAsync(0)
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked.mock.calls[1]?.[0]).toBe('Ки')
    expect(search.results.value).toEqual([kyivCity])
  })

  it('keeps only cities whose name starts with the query', async () => {
    mocked.mockResolvedValue([KYIV, TAIKKYI])
    const search = setup()
    search.query.value = 'Kyi'
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(mocked.mock.calls[0]?.[0]).toBe('Kyi')
    expect(search.results.value).toEqual([KYIV])
  })

  it('an irrelevant response yields an empty result without an error', async () => {
    mocked.mockResolvedValue([RIGA])
    const search = setup()
    search.query.value = 'Льв'
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(search.results.value).toEqual([])
    expect(search.error.value).toBe(false)
    expect(search.loading.value).toBe(false)
  })

  it('a response of an old request during debounce of a new one changes nothing', async () => {
    const first = deferred<City[]>()
    const second = deferred<City[]>()
    mocked.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const search = setup()
    search.query.value = 'Ky'
    await vi.advanceTimersByTimeAsync(300)
    search.query.value = 'Kyo'
    await vi.advanceTimersByTimeAsync(100)
    expect(mocked.mock.calls[0]?.[1]?.aborted).toBe(true)
    first.resolve([KYIV])
    await flushPromises()
    expect(search.results.value).toEqual([])
    expect(search.loading.value).toBe(true)
    await vi.advanceTimersByTimeAsync(200)
    expect(search.loading.value).toBe(true)
    second.resolve([KYOTO])
    await flushPromises()
    expect(search.results.value).toEqual([KYOTO])
    expect(search.loading.value).toBe(false)
  })

  it('new input immediately clears the old list', async () => {
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(search.results.value).toEqual([KYIV])
    search.query.value = 'Киї'
    await vi.advanceTimersByTimeAsync(0)
    expect(search.results.value).toEqual([])
    expect(search.loading.value).toBe(true)
  })

  it('retry after an error repeats the request and clears error', async () => {
    mocked.mockRejectedValueOnce(new Error('network'))
    const search = setup()
    search.query.value = 'Ки'
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(search.error.value).toBe(true)
    search.retry()
    expect(search.loading.value).toBe(true)
    await flushPromises()
    expect(mocked).toHaveBeenCalledTimes(2)
    expect(mocked.mock.calls[1]?.[0]).toBe('Ки')
    expect(search.error.value).toBe(false)
    expect(search.results.value).toEqual([KYIV])
  })

  it('without an active query a language change searches nothing', async () => {
    const search = setup()
    search.query.value = 'К'
    await vi.advanceTimersByTimeAsync(300)
    locale.value = 'en'
    await vi.advanceTimersByTimeAsync(300)
    expect(mocked).not.toHaveBeenCalled()
  })
})
