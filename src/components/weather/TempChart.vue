<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js'
import { formatNumber, t } from '@/i18n'
import { useThemeStore } from '@/stores/theme'
import { formatTemp } from '@/utils/temperature'

Chart.register(
  LineController,
  BarController,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
)

const props = defineProps<{
  labels: string[]
  temps: number[]
  precipitation: number[]
}>()

const theme = useThemeStore()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null

const hasPrecipitation = computed(() => props.precipitation.some((value) => value > 0))

function readColors() {
  const styles = getComputedStyle(document.documentElement)
  const read = (name: string) => styles.getPropertyValue(name).trim()
  return {
    ink: read('--ink'),
    surface: read('--surface'),
    muted: read('--muted'),
    grid: read('--line-soft'),
    bar: read('--rain-bar'),
    font: read('--font'),
  }
}

function buildConfig(): ChartConfiguration {
  const colors = readColors()
  const font = { family: colors.font, size: 11 }
  const datasets: ChartConfiguration['data']['datasets'] = [
    {
      type: 'line',
      data: props.temps,
      yAxisID: 'y',
      borderColor: colors.ink,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointBackgroundColor: colors.ink,
      fill: false,
      cubicInterpolationMode: 'monotone',
      order: 1,
    },
  ]
  const scales: NonNullable<ChartConfiguration['options']>['scales'] = {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: colors.muted, font, maxRotation: 0, autoSkip: true },
    },
    y: {
      position: 'left',
      grid: { color: colors.grid },
      border: { display: false },
      grace: 1,
      ticks: {
        color: colors.muted,
        font,
        maxTicksLimit: 5,
        precision: 0,
        callback: (value) => `${formatNumber(Number(value), 0)}°`,
      },
    },
  }
  if (hasPrecipitation.value) {
    datasets.push({
      type: 'bar',
      data: props.precipitation,
      yAxisID: 'y1',
      backgroundColor: colors.bar,
      borderWidth: 0,
      order: 2,
    })
    scales.y1 = {
      position: 'right',
      min: 0,
      suggestedMax: 3,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: colors.muted,
        font,
        maxTicksLimit: 4,
        callback: (value) => t('chart.axisPrecip', { value: formatNumber(Number(value)) }),
      },
    }
  }
  return {
    type: 'line',
    data: { labels: props.labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colors.ink,
          titleColor: colors.surface,
          bodyColor: colors.surface,
          titleFont: { ...font, size: 12, weight: 'bold' },
          bodyFont: { ...font, size: 12 },
          padding: 8,
          boxPadding: 4,
          callbacks: {
            label: (item) =>
              item.dataset.yAxisID === 'y1'
                ? t('chart.tooltipPrecip', { value: formatNumber(item.parsed.y ?? 0, 2) })
                : t('chart.tooltipTemp', { value: formatTemp(item.parsed.y ?? 0) }),
          },
        },
      },
      scales,
    },
  }
}

onMounted(() => {
  if (!canvas.value) return
  const config = buildConfig()
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (config.options && !reducedMotion) {
    config.options.animation = { duration: 600, easing: 'easeOutQuart' }
  }
  chart = new Chart(canvas.value, config)
})

function rebuild() {
  if (!chart) return
  const config = buildConfig()
  chart.data = config.data
  chart.options = config.options ?? {}
  chart.update()
}

watch(() => [props.labels, props.temps, props.precipitation], rebuild)

watch(
  () => theme.resolved,
  async () => {
    await nextTick()
    rebuild()
  },
)

onUnmounted(() => {
  chart?.destroy()
  chart = null
})
</script>

<template>
  <div class="temp-chart" data-testid="temp-chart">
    <div class="temp-chart__canvas">
      <canvas ref="canvas" />
    </div>
    <div v-if="hasPrecipitation" class="temp-chart__legend">
      <span class="temp-chart__legend-item">
        <span class="temp-chart__line" />{{ t('chart.temp') }}
      </span>
      <span class="temp-chart__legend-item">
        <span class="temp-chart__bar" />{{ t('chart.precip') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.temp-chart__canvas {
  position: relative;
  height: 180px;
}

.temp-chart__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 2px;
  color: var(--muted);
  font-size: 11px;
}

.temp-chart__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.temp-chart__line {
  display: inline-block;
  width: 14px;
  height: 2px;
  background: var(--ink);
}

.temp-chart__bar {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--rain-bar);
}
</style>
