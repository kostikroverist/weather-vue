import type { CurrentWeatherResponse, ForecastItem } from '@/types/api'
import type { CurrentView, DayPoint, HourPoint } from '@/types/forecast'
import { cityDateKey, cityHour, cityTime, cityWeekday } from '@/utils/time'

const round1 = (n: number) => Math.round(n * 10) / 10

const toPercent = (pop: number) => Math.round(pop * 100)

const precipitationOf = (item: ForecastItem) => (item.rain?.['3h'] ?? 0) + (item.snow?.['3h'] ?? 0)

export function toHourPoints(list: ForecastItem[], timezone: number, count = 8): HourPoint[] {
  return list.slice(0, count).map((item) => ({
    dt: item.dt,
    time: cityTime(item.dt, timezone),
    temp: item.main.temp,
    icon: item.weather[0]?.icon ?? '',
    description: item.weather[0]?.description ?? '',
    pop: toPercent(item.pop),
    rain: item.rain?.['3h'] ?? 0,
    snow: item.snow?.['3h'] ?? 0,
  }))
}

function toDayPoint(dateKey: string, items: ForecastItem[], timezone: number): DayPoint {
  const temps = items.map((item) => item.main.temp)
  const noon = items.reduce((best, item) =>
    Math.abs(cityHour(item.dt, timezone) - 12) < Math.abs(cityHour(best.dt, timezone) - 12)
      ? item
      : best,
  )
  const date = new Date(`${dateKey}T00:00:00Z`)
  return {
    dateKey,
    weekday: cityWeekday(noon.dt, timezone),
    day: date.getUTCDate(),
    month: date.getUTCMonth(),
    avg: Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length),
    min: Math.round(Math.min(...temps)),
    max: Math.round(Math.max(...temps)),
    icon: noon.weather[0]?.icon ?? '',
    pop: toPercent(Math.max(...items.map((item) => item.pop))),
    precipitation: round1(items.reduce((sum, item) => sum + precipitationOf(item), 0)),
  }
}

export function toDayPoints(list: ForecastItem[], timezone: number, days = 5): DayPoint[] {
  const groups = new Map<string, ForecastItem[]>()
  for (const item of list) {
    const key = cityDateKey(item.dt, timezone)
    const group = groups.get(key)
    if (group) group.push(item)
    else groups.set(key, [item])
  }
  return [...groups].slice(0, days).map(([dateKey, items]) => toDayPoint(dateKey, items, timezone))
}

export function toCurrentView(res: CurrentWeatherResponse): CurrentView {
  const { dt, timezone, sys } = res
  const isDay = sys.sunrise <= dt && dt < sys.sunset
  const sunEvent: CurrentView['sunEvent'] = isDay
    ? { kind: 'sunset', time: cityTime(sys.sunset, timezone) }
    : { kind: 'sunrise', time: cityTime(sys.sunrise, timezone) }
  return {
    temp: res.main.temp,
    feelsLike: res.main.feels_like,
    description: res.weather[0]?.description ?? '',
    icon: res.weather[0]?.icon ?? '',
    humidity: res.main.humidity,
    windSpeed: res.wind.speed,
    pressure: res.main.pressure,
    sunEvent,
  }
}
