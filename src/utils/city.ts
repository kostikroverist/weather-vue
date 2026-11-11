import { locale } from '@/i18n'
import type { GeoResult } from '@/types/api'
import type { City } from '@/types/city'

export const KYIV: City = {
  id: '50.45,30.52',
  names: { uk: 'Київ', en: 'Kyiv' },
  country: 'UA',
  lat: 50.4501,
  lon: 30.5234,
}

export function toCity(g: GeoResult): City {
  return {
    id: `${g.lat.toFixed(2)},${g.lon.toFixed(2)}`,
    names: { uk: g.local_names?.uk ?? g.name, en: g.local_names?.en ?? g.name },
    country: g.country,
    state: g.state,
    lat: g.lat,
    lon: g.lon,
  }
}

export function cityName(c: City): string {
  return c.names[locale.value]
}

export function cityLabel(c: City): string {
  return `${cityName(c)}, ${c.country}`
}

export function cityOptionLabel(c: City): string {
  const name = cityName(c)
  const parts = c.state && c.state !== name ? [name, c.state, c.country] : [name, c.country]
  return parts.join(', ')
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export function isCity(v: unknown): v is City {
  if (!isRecord(v) || !isRecord(v.names)) return false
  return (
    typeof v.id === 'string' &&
    typeof v.names.uk === 'string' &&
    typeof v.names.en === 'string' &&
    typeof v.country === 'string' &&
    (v.state === undefined || typeof v.state === 'string') &&
    Number.isFinite(v.lat) &&
    Number.isFinite(v.lon)
  )
}
