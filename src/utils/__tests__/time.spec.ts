import { describe, expect, it } from 'vitest'
import { cityDateKey, cityHour, cityTime, cityWeekday } from '@/utils/time'

describe('time', () => {
  it('formats time in the city timezone', () => {
    expect(cityTime(1700000000, 7200)).toBe('00:13')
    expect(cityTime(1700000000, 32400)).toBe('07:13')
  })

  it('builds the date key in the city timezone', () => {
    expect(cityDateKey(1700000000, 7200)).toBe('2023-11-15')
    expect(cityDateKey(1700000000, 0)).toBe('2023-11-14')
  })

  it('returns weekday and hour in the city timezone', () => {
    expect(cityWeekday(1700000000, 7200)).toBe(3)
    expect(cityHour(1700000000, 32400)).toBe(7)
  })
})
