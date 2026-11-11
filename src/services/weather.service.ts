import type { CurrentWeatherResponse, ForecastResponse } from '@/types/api'
import type { City } from '@/types/city'
import { http } from './http'

type Coords = Pick<City, 'lat' | 'lon'>

export async function getCurrent({ lat, lon }: Coords): Promise<CurrentWeatherResponse> {
  const { data } = await http.get<CurrentWeatherResponse>('/data/2.5/weather', {
    params: { lat, lon },
  })
  return data
}

export async function getForecast({ lat, lon }: Coords): Promise<ForecastResponse> {
  const { data } = await http.get<ForecastResponse>('/data/2.5/forecast', {
    params: { lat, lon },
  })
  return data
}
