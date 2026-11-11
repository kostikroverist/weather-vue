import type { GeoResult } from '@/types/api'
import type { City } from '@/types/city'
import { toCity } from '@/utils/city'
import { http } from './http'

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const { data } = await http.get<GeoResult[]>('/geo/1.0/direct', {
    params: { q: query, limit: 5 },
    signal,
  })
  return data.map(toCity)
}
