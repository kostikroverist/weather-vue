import axios from 'axios'
import type { GeoResult } from '@/types/api'
import type { City } from '@/types/city'
import { toCity } from '@/utils/city'
import { http } from './http'

const IP_URL = 'https://ipwho.is/'
const TIMEOUT_MS = 5000

interface IpResponse {
  success: boolean
  latitude?: number
  longitude?: number
}

export async function getCityByIp(): Promise<City | null> {
  try {
    const { data: ip } = await axios.get<IpResponse>(IP_URL, { timeout: TIMEOUT_MS })
    if (!ip.success || ip.latitude === undefined || ip.longitude === undefined) return null
    const { data } = await http.get<GeoResult[]>('/geo/1.0/reverse', {
      params: { lat: ip.latitude, lon: ip.longitude, limit: 1 },
      timeout: TIMEOUT_MS,
    })
    const first = data[0]
    return first ? toCity(first) : null
  } catch {
    return null
  }
}
