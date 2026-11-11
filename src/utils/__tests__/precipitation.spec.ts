import { describe, expect, it } from 'vitest'
import { toHourPoints } from '@/utils/forecast'
import { precipitationText, summarizePrecipitation } from '@/utils/precipitation'
import { item } from './factories'

const T18 = Date.UTC(2026, 10, 12, 18) / 1000

const hours = (mm: number[], snow: number[] = []) =>
  toHourPoints(
    mm.map((r, i) =>
      item(T18 + i * 10800, 3, {
        rain: r ? { '3h': r } : undefined,
        snow: snow[i] ? { '3h': snow[i] } : undefined,
      }),
    ),
    0,
  )

describe('precipitation', () => {
  it('збирає один діапазон з найсильнішим моментом', () => {
    expect(
      precipitationText(summarizePrecipitation(hours([0, 1.2, 2.4, 0.8, 0, 0, 0, 0]), 0)),
    ).toBe('Дощ з 21:00 до 06:00, найсильніший о 00:00: 2,4 мм')
  })

  it('зʼєднує два діапазони через «і»', () => {
    expect(precipitationText(summarizePrecipitation(hours([0.5, 0, 0, 0, 0, 0, 1, 0]), 0))).toBe(
      'Дощ з 18:00 до 21:00 і з 12:00 до 15:00, найсильніший о 12:00: 1 мм',
    )
  })

  it('бере не більше двох діапазонів', () => {
    expect(summarizePrecipitation(hours([1, 0, 1, 0, 1, 0, 0, 0]), 0)?.ranges).toHaveLength(2)
  })

  it('визначає вид опадів', () => {
    expect(
      summarizePrecipitation(hours([1, 0, 0, 0, 0, 0, 0, 0], [0, 0.5, 0, 0, 0, 0, 0, 0]), 0)?.kind,
    ).toBe('mixed')
    expect(
      summarizePrecipitation(hours([0, 0, 0, 0, 0, 0, 0, 0], [0, 0.4, 0, 0, 0, 0, 0, 0]), 0)?.kind,
    ).toBe('snow')
  })

  it('без опадів дає null і відповідний текст', () => {
    expect(summarizePrecipitation(hours([0, 0, 0, 0, 0, 0, 0, 0]), 0)).toBeNull()
    expect(precipitationText(null)).toBe('Без опадів найближчі 24 години')
  })
})
