import { describe, expect, it } from 'vitest'
import { contrastRatio, formatTemp, temperatureColor, temperatureInk } from '@/utils/temperature'

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

describe('contrastRatio', () => {
  it('gives 21 for black on white and 1 for equal colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
    expect(contrastRatio('#9dbbd6', '#9dbbd6')).toBeCloseTo(1, 5)
  })
})

describe('temperatureInk', () => {
  it('keeps every text color at WCAG AA 4.5:1 on the strip background', () => {
    for (let t = -30; t <= 40; t += 0.5) {
      const background = temperatureColor(t)
      const { ink, muted, rain } = temperatureInk(t)
      for (const color of [ink, muted, rain]) {
        expect(contrastRatio(color, background), `${color} on ${background} at ${t}°`).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})
