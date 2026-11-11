import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { locale } from '@/i18n'
import { daySeries, hourSeries, toCurrentView, toDayPoints, toHourPoints } from '@/utils/forecast'
import { current, item } from './factories'

const T0 = Date.UTC(2026, 10, 12) / 1000

describe('forecast', () => {
  afterEach(async () => {
    locale.value = 'uk'
    await nextTick()
  })

  it('toHourPoints бере перші 8 точок і переводить у відсотки та мм', () => {
    const list = Array.from({ length: 10 }, (_, i) =>
      item(T0 + i * 10800, i, { pop: 0.7, rain: { '3h': 1.25 } }),
    )
    const hours = toHourPoints(list, 0)
    expect(hours).toHaveLength(8)
    expect(hours[1]).toMatchObject({ time: '03:00', temp: 1, pop: 70, rain: 1.25, snow: 0 })
  })

  it('toHourPoints без rain/snow дає нулі, а не NaN', () => {
    expect(toHourPoints([item(T0, 5)], 0)[0]).toMatchObject({ rain: 0, snow: 0, pop: 0 })
  })

  it('toDayPoints групує за датою міста, рахує avg/min/max/pop/суму опадів', () => {
    const list = [
      item(T0, 2),
      item(T0 + 10800, 4, { pop: 0.3 }),
      item(T0 + 43200, 9, { icon: '10d', pop: 0.8, rain: { '3h': 1.2 } }),
      item(T0 + 54000, 6, { snow: { '3h': 0.4 } }),
    ]
    expect(toDayPoints(list, 0)[0]).toMatchObject({
      dateKey: '2026-11-12',
      avg: 5,
      min: 2,
      max: 9,
      icon: '10d',
      pop: 80,
      precipitation: 1.6,
    })
  })

  it('toDayPoints віддає погодинні точки дня і підсумок його опадів', () => {
    const list = [
      item(T0, 2),
      item(T0 + 10800, 4, { rain: { '3h': 0.6 } }),
      item(T0 + 21600, 5, { rain: { '3h': 1.4 } }),
      item(T0 + 86400, 3),
    ]
    const [first, second] = toDayPoints(list, 0)
    expect(first?.hours.map((h) => h.time)).toEqual(['00:00', '03:00', '06:00'])
    expect(first?.summary).toEqual({
      kind: 'rain',
      ranges: [{ from: '03:00', to: '09:00' }],
      peak: { time: '06:00', mm: 1.4 },
    })
    expect(second?.hours).toHaveLength(1)
    expect(second?.summary).toBeNull()
  })

  it('toDayPoints включає сьогодні першим днем, навіть неповним, і віддає не більше 5 днів', () => {
    const list = Array.from({ length: 40 }, (_, i) => item(T0 + 61200 + i * 10800, 1))
    const days = toDayPoints(list, 0)
    expect(days.map((d) => d.dateKey)).toEqual([
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
    ])
    expect(days[0]?.hours.map((h) => h.time)).toEqual(['17:00', '20:00', '23:00'])
    expect(days[1]?.hours).toHaveLength(8)
  })

  it('toDayPoints використовує часовий пояс міста (Токіо)', () => {
    const list = [item(T0 - 3600, 1), item(T0 + 3600, 3)]
    expect(toDayPoints(list, 32400).map((d) => d.dateKey)).toEqual(['2026-11-12'])
    expect(toDayPoints(list, 0).map((d) => d.dateKey)).toEqual(['2026-11-11', '2026-11-12'])
  })

  it('toDayPoints віддає не більше 5 днів', () => {
    const list = Array.from({ length: 48 }, (_, i) => item(T0 + i * 10800 + 3600, 1))
    expect(toDayPoints(list, 0)).toHaveLength(5)
  })

  it('hourSeries дає підписи-години, температури, опади і комірки смуги', () => {
    const hours = toHourPoints(
      [item(T0, 2, { pop: 0.4, rain: { '3h': 0.5 }, snow: { '3h': 0.2 } }), item(T0 + 10800, 3)],
      0,
    )
    expect(hourSeries(hours)).toEqual({
      labels: ['00:00', '03:00'],
      temps: [2, 3],
      precipitation: [0.7, 0],
      cells: [
        { label: '00:00', temp: 2, icon: '04d', pop: 40 },
        { label: '03:00', temp: 3, icon: '04d', pop: 0 },
      ],
    })
  })

  it('daySeries дає по днях: день тижня і число, середню, суму опадів і комірки', () => {
    const list = [
      item(T0 + 43200, 4, { icon: '10d', pop: 0.6, rain: { '3h': 1.5 } }),
      item(T0 + 86400 + 43200, 8),
    ]
    expect(daySeries(toDayPoints(list, 0))).toEqual({
      labels: ['Чт 12', 'Пт 13'],
      temps: [4, 8],
      precipitation: [1.5, 0],
      cells: [
        { label: 'Чт', temp: 4, icon: '10d', pop: 60 },
        { label: 'Пт', temp: 8, icon: '04d', pop: 0 },
      ],
    })
  })

  it('daySeries підписує дні мовою інтерфейсу', () => {
    locale.value = 'en'
    const days = toDayPoints([item(T0 + 43200, 4), item(T0 + 86400 + 43200, 8)], 0)
    const series = daySeries(days)
    expect(series.labels).toEqual(['Thu 12', 'Fri 13'])
    expect(series.cells.map((c) => c.label)).toEqual(['Thu', 'Fri'])
  })

  it('toCurrentView вибирає найближчу подію сонця', () => {
    const sys = { sunrise: 200, sunset: 900 }
    expect(toCurrentView(current({ dt: 100, sys })).sunEvent?.kind).toBe('sunrise')
    expect(toCurrentView(current({ dt: 500, sys })).sunEvent?.kind).toBe('sunset')
    expect(toCurrentView(current({ dt: 1000, sys })).sunEvent?.kind).toBe('sunrise')
  })

  it('toCurrentView без сходу чи заходу сонця (полярний день/ніч) не дає події', () => {
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 0 } })).sunEvent).toBeNull()
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 900 } })).sunEvent).toBeNull()
    expect(toCurrentView(current({ sys: { sunrise: 200, sunset: 0 } })).sunEvent).toBeNull()
  })

  it('toCurrentView рахує isDay між сходом і заходом, а полярний випадок вважає днем', () => {
    const sys = { sunrise: 200, sunset: 900 }
    expect(toCurrentView(current({ dt: 100, sys })).isDay).toBe(false)
    expect(toCurrentView(current({ dt: 200, sys })).isDay).toBe(true)
    expect(toCurrentView(current({ dt: 900, sys })).isDay).toBe(false)
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 0 } })).isDay).toBe(true)
  })
})
