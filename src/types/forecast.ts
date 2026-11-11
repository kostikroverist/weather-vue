export interface HourPoint {
  dt: number
  time: string
  temp: number
  icon: string
  description: string
  pop: number
  rain: number
  snow: number
}

export interface DayPoint {
  dateKey: string
  weekday: number
  day: number
  month: number
  avg: number
  min: number
  max: number
  icon: string
  pop: number
  precipitation: number
  hours: HourPoint[]
  summary: PrecipitationSummary | null
}

export interface CurrentView {
  temp: number
  feelsLike: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
  pressure: number
  sunEvent: { kind: 'sunrise' | 'sunset'; time: string } | null
  isDay: boolean
}

export interface StripCell {
  label: string
  temp: number
  icon: string
  pop: number
}

export interface ForecastSeries {
  labels: string[]
  temps: number[]
  precipitation: number[]
  cells: StripCell[]
}

export type PrecipitationKind = 'rain' | 'snow' | 'mixed'

export interface PrecipitationSummary {
  kind: PrecipitationKind
  ranges: { from: string; to: string }[]
  peak: { time: string; mm: number }
}
