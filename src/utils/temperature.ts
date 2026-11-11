const SCALE: [number, string][] = [
  [-20, '#3f6fa8'],
  [0, '#9dbbd6'],
  [12, '#ede3c8'],
  [24, '#e9a06b'],
  [35, '#c8483a'],
]

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

const toHex = (rgb: number[]) =>
  '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

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
