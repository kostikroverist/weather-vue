const pad = (n: number) => String(n).padStart(2, '0')

const shifted = (dt: number, timezone: number) => new Date((dt + timezone) * 1000)

export function cityTime(dt: number, timezone: number): string {
  const d = shifted(dt, timezone)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function cityDateKey(dt: number, timezone: number): string {
  const d = shifted(dt, timezone)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export function cityHour(dt: number, timezone: number): number {
  return shifted(dt, timezone).getUTCHours()
}

export function cityWeekday(dt: number, timezone: number): number {
  return shifted(dt, timezone).getUTCDay()
}
