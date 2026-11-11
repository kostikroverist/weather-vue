import type { CurrentWeatherResponse, ForecastItem } from '@/types/api'
import { weekdayName } from '@/i18n'
import type { CurrentView, DayPoint, ForecastSeries, HourPoint } from '@/types/forecast'
import { summarizePrecipitation } from '@/utils/precipitation'
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
  const hours = toHourPoints(items, timezone, items.length)
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
    hours,
    summary: summarizePrecipitation(hours, timezone),
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

export function hourSeries(hours: HourPoint[]): ForecastSeries {
  return {
    labels: hours.map((h) => h.time),
    temps: hours.map((h) => h.temp),
    precipitation: hours.map((h) => h.rain + h.snow),
    cells: hours.map((h) => ({ label: h.time, temp: h.temp, icon: h.icon, pop: h.pop })),
  }
}

export function daySeries(days: DayPoint[]): ForecastSeries {
  return {
    labels: days.map((d) => `${weekdayName(d.weekday)} ${d.day}`),
    temps: days.map((d) => d.avg),
    precipitation: days.map((d) => d.precipitation),
    cells: days.map((d) => ({
      label: weekdayName(d.weekday),
      temp: d.avg,
      icon: d.icon,
      pop: d.pop,
    })),
  }
}

export function toCurrentView(res: CurrentWeatherResponse): CurrentView {
  const { dt, timezone, sys } = res
  const isPolar = sys.sunrise === 0 || sys.sunset === 0
  const isDay = isPolar || (sys.sunrise <= dt && dt < sys.sunset)
  let sunEvent: CurrentView['sunEvent'] = null
  if (!isPolar) {
    sunEvent = isDay
      ? { kind: 'sunset', time: cityTime(sys.sunset, timezone) }
      : { kind: 'sunrise', time: cityTime(sys.sunrise, timezone) }
  }
  return {
    temp: res.main.temp,
    feelsLike: res.main.feels_like,
    description: res.weather[0]?.description ?? '',
    icon: res.weather[0]?.icon ?? '',
    humidity: res.main.humidity,
    windSpeed: res.wind.speed,
    pressure: res.main.pressure,
    sunEvent,
    isDay,
  }
}
