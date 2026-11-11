import { formatNumber, t, type MessageKey } from '@/i18n'
import type { HourPoint, PrecipitationKind, PrecipitationSummary } from '@/types/forecast'
import { cityTime } from '@/utils/time'

const STEP = 10800
const MAX_RANGES = 2

const amount = (h: HourPoint) => h.rain + h.snow

function rangesOf(hours: HourPoint[], timezone: number): PrecipitationSummary['ranges'] {
  const groups: HourPoint[][] = []
  let open = false
  for (const h of hours) {
    if (amount(h) <= 0) {
      open = false
      continue
    }
    if (open) groups[groups.length - 1]!.push(h)
    else groups.push([h])
    open = true
  }
  return groups.slice(0, MAX_RANGES).map((group) => ({
    from: cityTime(group[0]!.dt, timezone),
    to: cityTime(group[group.length - 1]!.dt + STEP, timezone),
  }))
}

export function summarizePrecipitation(
  hours: HourPoint[],
  timezone: number,
): PrecipitationSummary | null {
  const wet = hours.filter((h) => amount(h) > 0)
  if (!wet.length) return null
  const hasRain = wet.some((h) => h.rain > 0)
  const hasSnow = wet.some((h) => h.snow > 0)
  const kind: PrecipitationKind = hasRain && hasSnow ? 'mixed' : hasRain ? 'rain' : 'snow'
  const peak = wet.reduce((best, h) => (amount(h) > amount(best) ? h : best))
  return {
    kind,
    ranges: rangesOf(hours, timezone),
    peak: { time: cityTime(peak.dt, timezone), mm: Math.round(amount(peak) * 10) / 10 },
  }
}

export function precipitationText(
  summary: PrecipitationSummary | null,
  emptyKey: MessageKey = 'precip.none',
): string {
  if (!summary) return t(emptyKey)
  const ranges = summary.ranges.map((range) => t('precip.range', range)).join(t('precip.and'))
  const peak = t('precip.peak', {
    time: summary.peak.time,
    mm: formatNumber(summary.peak.mm),
  })
  return `${t(`precip.${summary.kind}`)} ${ranges}${peak}`
}
