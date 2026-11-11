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

  it('toHourPoints takes the first 8 points and converts to percent and mm', () => {
    const list = Array.from({ length: 10 }, (_, i) =>
      item(T0 + i * 10800, i, { pop: 0.7, rain: { '3h': 1.25 } }),
    )
    const hours = toHourPoints(list, 0)
    expect(hours).toHaveLength(8)
    expect(hours[1]).toMatchObject({ time: '03:00', temp: 1, pop: 70, rain: 1.25, snow: 0 })
  })

  it('toHourPoints without rain/snow yields zeros, not NaN', () => {
    expect(toHourPoints([item(T0, 5)], 0)[0]).toMatchObject({ rain: 0, snow: 0, pop: 0 })
  })

  it('toDayPoints groups by city date and computes avg/min/max/pop/precipitation sum', () => {
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

  it('toDayPoints returns the hourly points of the day and its precipitation total', () => {
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

  it('toDayPoints includes today as the first day, even if partial, and returns at most 5 days', () => {
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

  it('toDayPoints uses the city time zone (Tokyo)', () => {
    const list = [item(T0 - 3600, 1), item(T0 + 3600, 3)]
    expect(toDayPoints(list, 32400).map((d) => d.dateKey)).toEqual(['2026-11-12'])
    expect(toDayPoints(list, 0).map((d) => d.dateKey)).toEqual(['2026-11-11', '2026-11-12'])
  })

  it('toDayPoints returns at most 5 days', () => {
    const list = Array.from({ length: 48 }, (_, i) => item(T0 + i * 10800 + 3600, 1))
    expect(toDayPoints(list, 0)).toHaveLength(5)
  })

  it('hourSeries yields hour labels, temperatures, precipitation and strip cells', () => {
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

  it('daySeries yields per day: weekday and date, average, precipitation sum and cells', () => {
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

  it('daySeries labels days in the interface language', () => {
    locale.value = 'en'
    const days = toDayPoints([item(T0 + 43200, 4), item(T0 + 86400 + 43200, 8)], 0)
    const series = daySeries(days)
    expect(series.labels).toEqual(['Thu 12', 'Fri 13'])
    expect(series.cells.map((c) => c.label)).toEqual(['Thu', 'Fri'])
  })

  it('toCurrentView picks the nearest sun event', () => {
    const sys = { sunrise: 200, sunset: 900 }
    expect(toCurrentView(current({ dt: 100, sys })).sunEvent?.kind).toBe('sunrise')
    expect(toCurrentView(current({ dt: 500, sys })).sunEvent?.kind).toBe('sunset')
    expect(toCurrentView(current({ dt: 1000, sys })).sunEvent?.kind).toBe('sunrise')
  })

  it('toCurrentView without sunrise or sunset (polar day/night) yields no event', () => {
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 0 } })).sunEvent).toBeNull()
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 900 } })).sunEvent).toBeNull()
    expect(toCurrentView(current({ sys: { sunrise: 200, sunset: 0 } })).sunEvent).toBeNull()
  })

  it('toCurrentView computes isDay between sunrise and sunset and treats the polar case as day', () => {
    const sys = { sunrise: 200, sunset: 900 }
    expect(toCurrentView(current({ dt: 100, sys })).isDay).toBe(false)
    expect(toCurrentView(current({ dt: 200, sys })).isDay).toBe(true)
    expect(toCurrentView(current({ dt: 900, sys })).isDay).toBe(false)
    expect(toCurrentView(current({ sys: { sunrise: 0, sunset: 0 } })).isDay).toBe(true)
  })
})
