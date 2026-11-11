import { computed, ref, watch, type Ref } from 'vue'
import type { DayPoint, HourPoint } from '@/types/forecast'
import { daySeries, hourSeries } from '@/utils/forecast'

export function useForecastView(
  hours: Ref<HourPoint[]>,
  days: Ref<DayPoint[]>,
  cityId: () => string | undefined,
) {
  const mode = ref<'day' | 'days'>('day')
  const selectedKey = ref('')

  watch([cityId, mode], () => {
    selectedKey.value = ''
  })

  watch(days, (list) => {
    if (!list.some((d) => d.dateKey === selectedKey.value)) selectedKey.value = ''
  })

  const series = computed(() => {
    if (mode.value === 'day') return hourSeries(hours.value)
    const day = days.value.find((d) => d.dateKey === selectedKey.value)
    return day ? hourSeries(day.hours) : daySeries(days.value)
  })

  return { mode, selectedKey, series }
}
