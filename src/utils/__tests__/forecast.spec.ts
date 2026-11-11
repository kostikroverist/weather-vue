import { describe, expect, it } from 'vitest'
import { toCurrentView, toDayPoints, toHourPoints } from '@/utils/forecast'
import { current, item } from './factories'

const T0 = Date.UTC(2026, 10, 12) / 1000

describe('forecast', () => {
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

  it('toDayPoints використовує часовий пояс міста (Токіо)', () => {
    const list = [item(T0 - 3600, 1), item(T0 + 3600, 3)]
    expect(toDayPoints(list, 32400).map((d) => d.dateKey)).toEqual(['2026-11-12'])
    expect(toDayPoints(list, 0).map((d) => d.dateKey)).toEqual(['2026-11-11', '2026-11-12'])
  })

  it('toDayPoints віддає не більше 5 днів', () => {
    const list = Array.from({ length: 48 }, (_, i) => item(T0 + i * 10800 + 3600, 1))
    expect(toDayPoints(list, 0)).toHaveLength(5)
  })

  it('toCurrentView вибирає найближчу подію сонця', () => {
    expect(
      toCurrentView(current({ dt: 100, sys: { sunrise: 200, sunset: 900 } })).sunEvent.kind,
    ).toBe('sunrise')
    expect(
      toCurrentView(current({ dt: 500, sys: { sunrise: 200, sunset: 900 } })).sunEvent.kind,
    ).toBe('sunset')
    expect(
      toCurrentView(current({ dt: 1000, sys: { sunrise: 200, sunset: 900 } })).sunEvent.kind,
    ).toBe('sunrise')
  })
})
