import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref, type EffectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { getCurrent, getForecast } from '@/services/weather.service'
import { useWeather } from '@/composables/useWeather'
import { KYIV } from '@/utils/city'
import { current, item } from '@/utils/__tests__/factories'
import type { City } from '@/types/city'
import type { CurrentWeatherResponse, ForecastResponse } from '@/types/api'

vi.mock('@/services/weather.service')

const T0 = Date.UTC(2026, 10, 12) / 1000

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

const forecast = (temp: number): ForecastResponse => ({
  list: Array.from({ length: 40 }, (_, i) => item(T0 + i * 10800, temp)),
  city: { timezone: 7200 },
})

function deferred<T>() {
  let resolve!: (v: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

let scope: EffectScope

function setup(city: City | null) {
  const cityRef = ref<City | null>(city)
  scope = effectScope()
  const weather = scope.run(() => useWeather(cityRef))!
  return { cityRef, weather }
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.mocked(getCurrent).mockReset().mockResolvedValue(current())
    vi.mocked(getForecast).mockReset().mockResolvedValue(forecast(5))
  })

  afterEach(() => scope.stop())

  it('з містом заповнює current, hours, days', async () => {
    const { weather } = setup(KYIV)
    expect(weather.loading.value).toBe(true)
    await flushPromises()
    expect(weather.current.value?.icon).toBe('01d')
    expect(weather.hours.value).toHaveLength(8)
    expect(weather.days.value).toHaveLength(5)
    expect(weather.precipitation.value).toBeNull()
    expect(weather.loading.value).toBe(false)
    expect(weather.error.value).toBe(false)
  })

  it('з city = null не робить запитів', async () => {
    const { weather } = setup(null)
    await flushPromises()
    expect(getCurrent).not.toHaveBeenCalled()
    expect(getForecast).not.toHaveBeenCalled()
    expect(weather.current.value).toBeNull()
    expect(weather.hours.value).toEqual([])
    expect(weather.days.value).toEqual([])
    expect(weather.loading.value).toBe(false)
  })

  it('помилка getForecast ставить error, а reload відновлює дані', async () => {
    vi.mocked(getForecast).mockRejectedValueOnce(new Error('500'))
    const { weather } = setup(KYIV)
    await flushPromises()
    expect(weather.error.value).toBe(true)
    expect(weather.loading.value).toBe(false)
    weather.reload()
    await flushPromises()
    expect(weather.error.value).toBe(false)
    expect(weather.hours.value).toHaveLength(8)
  })

  it('пізня відповідь попереднього міста не перезаписує нове', async () => {
    const currentA = deferred<CurrentWeatherResponse>()
    const forecastA = deferred<ForecastResponse>()
    vi.mocked(getCurrent).mockReturnValueOnce(currentA.promise)
    vi.mocked(getForecast).mockReturnValueOnce(forecastA.promise)
    const { cityRef, weather } = setup(KYIV)
    cityRef.value = LVIV
    await flushPromises()
    expect(weather.hours.value[0]?.temp).toBe(5)
    currentA.resolve(current())
    forecastA.resolve(forecast(-10))
    await flushPromises()
    expect(weather.hours.value[0]?.temp).toBe(5)
    expect(getForecast).toHaveBeenLastCalledWith(LVIV)
  })
})
