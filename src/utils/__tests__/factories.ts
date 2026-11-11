import type { CurrentWeatherResponse, ForecastItem } from '@/types/api'

export function item(
  dt: number,
  temp: number,
  extra: Partial<ForecastItem> & { icon?: string } = {},
): ForecastItem {
  const { icon = '04d', ...rest } = extra
  return {
    dt,
    main: { temp },
    weather: [{ id: 803, main: 'Clouds', description: 'хмарно', icon }],
    pop: 0,
    ...rest,
  }
}

export function current(extra: Partial<CurrentWeatherResponse> = {}): CurrentWeatherResponse {
  return {
    dt: 1794441600,
    timezone: 0,
    weather: [{ id: 800, main: 'Clear', description: 'ясно', icon: '01d' }],
    main: { temp: 5.6, feels_like: 2.1, humidity: 80, pressure: 1012 },
    wind: { speed: 3.4 },
    sys: { sunrise: 1794463200, sunset: 1794499200 },
    ...extra,
  }
}
