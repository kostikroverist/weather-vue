import { onScopeDispose, ref, watch, type Ref } from 'vue'
import { locale } from '@/i18n'
import { getCurrent, getForecast } from '@/services/weather.service'
import type { City } from '@/types/city'
import type { CurrentView, DayPoint, HourPoint, PrecipitationSummary } from '@/types/forecast'
import { toCurrentView, toDayPoints, toHourPoints } from '@/utils/forecast'
import { summarizePrecipitation } from '@/utils/precipitation'
import { cityDateKey } from '@/utils/time'

const REFRESH_MS = 10 * 60 * 1000

export function useWeather(city: Ref<City | null>) {
  const current = ref<CurrentView | null>(null)
  const hours = ref<HourPoint[]>([])
  const days = ref<DayPoint[]>([])
  const todayKey = ref('')
  const precipitation = ref<PrecipitationSummary | null>(null)
  const loading = ref(false)
  const error = ref(false)
  const updatedAt = ref<number | null>(null)

  let requestId = 0
  let shownCityId: string | null = null

  function reset(): void {
    current.value = null
    hours.value = []
    days.value = []
    todayKey.value = ''
    precipitation.value = null
    updatedAt.value = null
  }

  async function load(): Promise<void> {
    const id = ++requestId
    const target = city.value
    error.value = false
    if (target?.id !== shownCityId) reset()
    shownCityId = target?.id ?? null
    if (!target) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const [currentRes, forecastRes] = await Promise.all([getCurrent(target), getForecast(target)])
      if (id !== requestId) return
      const timezone = forecastRes.city.timezone
      current.value = toCurrentView(currentRes)
      hours.value = toHourPoints(forecastRes.list, timezone)
      days.value = toDayPoints(forecastRes.list, timezone)
      todayKey.value = cityDateKey(currentRes.dt, timezone)
      precipitation.value = summarizePrecipitation(hours.value, timezone)
      updatedAt.value = Date.now()
    } catch {
      if (id !== requestId) return
      if (current.value) return
      error.value = true
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  function reload(): void {
    void load()
  }

  function onVisibilityChange(): void {
    if (document.visibilityState !== 'visible' || updatedAt.value === null) return
    if (Date.now() - updatedAt.value >= REFRESH_MS) reload()
  }

  let timer: ReturnType<typeof setInterval> | undefined

  function stopAutoRefresh(): void {
    clearInterval(timer)
    timer = undefined
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }

  watch(
    () => city.value !== null,
    (hasCity) => {
      stopAutoRefresh()
      if (!hasCity) return
      timer = setInterval(reload, REFRESH_MS)
      document.addEventListener('visibilitychange', onVisibilityChange)
    },
    { immediate: true },
  )

  onScopeDispose(stopAutoRefresh)

  watch([() => city.value?.id, locale], reload, { immediate: true })

  return { current, hours, days, todayKey, precipitation, loading, error, updatedAt, reload }
}
