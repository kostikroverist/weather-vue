import { describe, expect, it } from 'vitest'
import { formatTemp, temperatureColor } from '@/utils/temperature'

describe('formatTemp', () => {
  it('rounds and adds a sign', () => {
    expect(formatTemp(5.6)).toBe('+6°')
    expect(formatTemp(0)).toBe('0°')
    expect(formatTemp(-0.4)).toBe('0°')
    expect(formatTemp(-2.4)).toBe('−2°')
  })
})

describe('temperatureColor', () => {
  it('interpolates the scale and clamps the edges', () => {
    expect(temperatureColor(-30)).toBe('#3f6fa8')
    expect(temperatureColor(0)).toBe('#9dbbd6')
    expect(temperatureColor(6)).toBe('#c5cfcf')
    expect(temperatureColor(35)).toBe('#c8483a')
    expect(temperatureColor(40)).toBe('#c8483a')
  })
})
