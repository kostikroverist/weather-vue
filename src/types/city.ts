export interface City {
  id: string
  names: { uk: string; en: string }
  country: string
  state?: string
  lat: number
  lon: number
}
