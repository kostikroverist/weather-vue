import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref, type EffectScope } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { locale } from '@/i18n'
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

  afterEach(async () => {
    scope.stop()
    locale.value = 'uk'
    await nextTick()
  })

  it('з містом заповнює current, hours, days', async () => {
    const { weather } = setup(KYIV)
    expect(weather.loading.value).toBe(true)
    await flushPromises()
    expect(weather.current.value?.icon).toBe('01d')
    expect(weather.hours.value).toHaveLength(8)
    expect(weather.days.value).toHaveLength(5)
    expect(weather.days.value[0]?.dateKey).toBe('2026-11-12')
    expect(weather.todayKey.value).toBe('2026-11-12')
    expect(weather.precipitation.value).toBeNull()
    expect(weather.loading.value).toBe(false)
    expect(weather.error.value).toBe(false)
  })

  it('todayKey береться з current.dt у часі міста, навіть якщо прогноз уже з завтра', async () => {
    vi.mocked(getCurrent).mockResolvedValue(current({ dt: T0 - 86400 }))
    const { weather } = setup(KYIV)
    await flushPromises()
    expect(weather.todayKey.value).toBe('2026-11-11')
    expect(weather.days.value.map((d) => d.dateKey)).not.toContain('2026-11-11')
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

  it('при зміні міста скидає дані попереднього, поки вантажиться нове', async () => {
    const { cityRef, weather } = setup(KYIV)
    await flushPromises()
    expect(weather.current.value).not.toBeNull()
    const currentB = deferred<CurrentWeatherResponse>()
    const forecastB = deferred<ForecastResponse>()
    vi.mocked(getCurrent).mockReturnValueOnce(currentB.promise)
    vi.mocked(getForecast).mockReturnValueOnce(forecastB.promise)
    cityRef.value = LVIV
    await nextTick()
    expect(weather.current.value).toBeNull()
    expect(weather.todayKey.value).toBe('')
    expect(weather.hours.value).toEqual([])
    expect(weather.days.value).toEqual([])
    expect(weather.loading.value).toBe(true)
    currentB.resolve(current())
    forecastB.resolve(forecast(-3))
    await flushPromises()
    expect(weather.current.value).not.toBeNull()
    expect(weather.hours.value[0]?.temp).toBe(-3)
    expect(weather.loading.value).toBe(false)
  })

  it('перезапитує дані при зміні мови, не скидаючи показані', async () => {
    const { weather } = setup(KYIV)
    await flushPromises()
    expect(getCurrent).toHaveBeenCalledTimes(1)
    vi.mocked(getCurrent).mockResolvedValueOnce(
      current({ weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }] }),
    )
    locale.value = 'en'
    await nextTick()
    expect(weather.loading.value).toBe(true)
    expect(weather.current.value?.description).toBe('ясно')
    await flushPromises()
    expect(getCurrent).toHaveBeenCalledTimes(2)
    expect(getForecast).toHaveBeenCalledTimes(2)
    expect(weather.current.value?.description).toBe('clear sky')
    expect(weather.loading.value).toBe(false)
  })

  it('новий обʼєкт міста з тим самим id не робить повторних запитів', async () => {
    const { cityRef } = setup(KYIV)
    await flushPromises()
    expect(getCurrent).toHaveBeenCalledTimes(1)
    cityRef.value = { ...KYIV, names: { ...KYIV.names } }
    await flushPromises()
    expect(getCurrent).toHaveBeenCalledTimes(1)
    expect(getForecast).toHaveBeenCalledTimes(1)
  })

  describe('оновлення', () => {
    const REFRESH_MS = 10 * 60 * 1000

    function setVisibility(state: 'visible' | 'hidden'): void {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: state })
    }

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-11-12T10:00:00Z'))
      setVisibility('visible')
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('updatedAt виставляється після успішного завантаження', async () => {
      const { weather } = setup(KYIV)
      expect(weather.updatedAt.value).toBeNull()
      await vi.advanceTimersByTimeAsync(0)
      expect(weather.updatedAt.value).toBe(Date.now())
    })

    it('updatedAt скидається в null при зміні міста', async () => {
      const { cityRef, weather } = setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      vi.mocked(getCurrent).mockReturnValueOnce(deferred<CurrentWeatherResponse>().promise)
      cityRef.value = LVIV
      await nextTick()
      expect(weather.updatedAt.value).toBeNull()
    })

    it('через 10 хвилин повторно запитує дані без скидання current', async () => {
      const { weather } = setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      const first = weather.updatedAt.value
      const pending = deferred<CurrentWeatherResponse>()
      vi.mocked(getCurrent).mockReturnValueOnce(pending.promise)
      await vi.advanceTimersByTimeAsync(REFRESH_MS)
      expect(getCurrent).toHaveBeenCalledTimes(2)
      expect(weather.current.value).not.toBeNull()
      pending.resolve(current())
      await vi.advanceTimersByTimeAsync(0)
      expect(weather.updatedAt.value).toBeGreaterThan(first!)
    })

    it('падіння повторного запиту лишає дані, error і updatedAt', async () => {
      const { weather } = setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      const first = weather.updatedAt.value
      vi.mocked(getForecast).mockRejectedValueOnce(new Error('500'))
      await vi.advanceTimersByTimeAsync(REFRESH_MS)
      expect(getForecast).toHaveBeenCalledTimes(2)
      expect(weather.current.value).not.toBeNull()
      expect(weather.error.value).toBe(false)
      expect(weather.updatedAt.value).toBe(first)
    })

    it('visibilitychange зі старими даними робить запит', async () => {
      setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      vi.setSystemTime(Date.now() + REFRESH_MS + 1000)
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
      expect(getCurrent).toHaveBeenCalledTimes(2)
    })

    it('visibilitychange зі свіжими даними або прихованою вкладкою не робить запиту', async () => {
      setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      vi.setSystemTime(Date.now() + REFRESH_MS / 2)
      document.dispatchEvent(new Event('visibilitychange'))
      vi.setSystemTime(Date.now() + REFRESH_MS)
      setVisibility('hidden')
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
      expect(getCurrent).toHaveBeenCalledTimes(1)
    })

    it('після scope.stop() таймер і слухач не працюють', async () => {
      setup(KYIV)
      await vi.advanceTimersByTimeAsync(0)
      scope.stop()
      vi.setSystemTime(Date.now() + REFRESH_MS + 1000)
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(REFRESH_MS * 2)
      expect(getCurrent).toHaveBeenCalledTimes(1)
    })

    it('без міста не запитує за таймером і visibilitychange', async () => {
      setup(null)
      expect(vi.getTimerCount()).toBe(0)
      await vi.advanceTimersByTimeAsync(REFRESH_MS * 2)
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
      expect(getCurrent).not.toHaveBeenCalled()
    })
  })
})
