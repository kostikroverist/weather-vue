const SCALE: [number, string][] = [
  [-20, '#3f6fa8'],
  [0, '#9dbbd6'],
  [12, '#ede3c8'],
  [24, '#e9a06b'],
  [35, '#c8483a'],
]

export interface TemperatureInk {
  ink: string
  muted: string
  rain: string
}

const INK_ON_DARK: TemperatureInk = { ink: '#ffffff', muted: '#ffffff', rain: '#ffffff' }
const INK_ON_MID: TemperatureInk = { ink: '#000000', muted: '#000000', rain: '#000000' }
const INK_ON_LIGHT: TemperatureInk = { ink: '#1d2127', muted: '#4f5660', rain: '#2f5f96' }

const DARK_BELOW = 0.18
const LIGHT_FROM = 0.67

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

const toHex = (rgb: number[]) =>
  '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

const toLinear = (channel: number) => {
  const v = channel / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}

export function formatTemp(t: number): string {
  const value = Math.round(t) || 0
  if (value > 0) return `+${value}°`
  if (value < 0) return `−${Math.abs(value)}°`
  return '0°'
}

export function temperatureColor(t: number): string {
  const first = SCALE[0]!
  const last = SCALE[SCALE.length - 1]!
  if (t <= first[0]) return first[1]
  if (t >= last[0]) return last[1]
  const upper = SCALE.findIndex(([stop]) => t <= stop)
  const [t0, c0] = SCALE[upper - 1]!
  const [t1, c1] = SCALE[upper]!
  const k = (t - t0) / (t1 - t0)
  const a = toRgb(c0)
  const b = toRgb(c1)
  return toHex(a.map((v, i) => v + (b[i]! - v) * k))
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map(toLinear)
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA)
  const b = relativeLuminance(hexB)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

export function temperatureInk(t: number): TemperatureInk {
  const luminance = relativeLuminance(temperatureColor(t))
  if (luminance < DARK_BELOW) return INK_ON_DARK
  if (luminance < LIGHT_FROM) return INK_ON_MID
  return INK_ON_LIGHT
}
