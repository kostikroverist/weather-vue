import { describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useForecastView } from '@/composables/useForecastView'
import type { DayPoint, HourPoint } from '@/types/forecast'
import { toDayPoints } from '@/utils/forecast'
import { item } from '@/utils/__tests__/factories'

const T0 = Date.UTC(2026, 10, 12) / 1000

const daysFrom = (start: number): DayPoint[] =>
  toDayPoints(
    Array.from({ length: 16 }, (_, i) => item(start + i * 10800, 1)),
    0,
  )

describe('useForecastView', () => {
  it('скидає вибраний день, якщо після перезапиту його немає в списку днів', async () => {
    const hours = ref<HourPoint[]>([])
    const days = ref<DayPoint[]>(daysFrom(T0))
    const scope = effectScope()
    const view = scope.run(() => useForecastView(hours, days, () => 'kyiv'))!
    view.mode.value = 'days'
    await nextTick()
    view.selectedKey.value = '2026-11-12'
    await nextTick()
    days.value = daysFrom(T0 + 86400)
    await nextTick()
    expect(view.selectedKey.value).toBe('')
    expect(view.series.value.labels).toHaveLength(2)
    scope.stop()
  })

  it('лишає вибраний день, якщо він є в оновленому списку', async () => {
    const hours = ref<HourPoint[]>([])
    const days = ref<DayPoint[]>(daysFrom(T0))
    const scope = effectScope()
    const view = scope.run(() => useForecastView(hours, days, () => 'kyiv'))!
    view.mode.value = 'days'
    await nextTick()
    view.selectedKey.value = '2026-11-13'
    await nextTick()
    days.value = daysFrom(T0)
    await nextTick()
    expect(view.selectedKey.value).toBe('2026-11-13')
    expect(view.series.value.labels).toHaveLength(8)
    scope.stop()
  })
})
