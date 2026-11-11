import { ref, watch, type Ref } from 'vue'
import { getCurrent, getForecast } from '@/services/weather.service'
import type { City } from '@/types/city'
import type { CurrentView, DayPoint, HourPoint, PrecipitationSummary } from '@/types/forecast'
import { toCurrentView, toDayPoints, toHourPoints } from '@/utils/forecast'
import { summarizePrecipitation } from '@/utils/precipitation'

export function useWeather(city: Ref<City | null>) {
  const current = ref<CurrentView | null>(null)
  const hours = ref<HourPoint[]>([])
  const days = ref<DayPoint[]>([])
  const precipitation = ref<PrecipitationSummary | null>(null)
  const loading = ref(false)
  const error = ref(false)

  let requestId = 0

  function reset(): void {
    current.value = null
    hours.value = []
    days.value = []
    precipitation.value = null
  }

  async function load(): Promise<void> {
    const id = ++requestId
    const target = city.value
    error.value = false
    if (!target) {
      reset()
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
      precipitation.value = summarizePrecipitation(hours.value, timezone)
    } catch {
      if (id !== requestId) return
      reset()
      error.value = true
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  function reload(): void {
    void load()
  }

  watch(city, reload, { immediate: true })

  return { current, hours, days, precipitation, loading, error, reload }
}
