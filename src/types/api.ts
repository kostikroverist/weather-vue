export interface WeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

export interface GeoResult {
  name: string
  local_names?: Record<string, string>
  lat: number
  lon: number
  country: string
  state?: string
}

export interface CurrentWeatherResponse {
  dt: number
  timezone: number
  weather: WeatherCondition[]
  main: { temp: number; feels_like: number; humidity: number; pressure: number }
  wind: { speed: number }
  sys: { sunrise: number; sunset: number }
}

export interface ForecastItem {
  dt: number
  main: { temp: number }
  weather: WeatherCondition[]
  pop: number
  rain?: { '3h'?: number }
  snow?: { '3h'?: number }
}

export interface ForecastResponse {
  list: ForecastItem[]
  city: { timezone: number }
}
