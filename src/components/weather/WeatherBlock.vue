<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { monthName, t, weekdayName } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import CitySearch from '@/components/weather/CitySearch.vue'
import CurrentCard from '@/components/weather/CurrentCard.vue'
import DaysList from '@/components/weather/DaysList.vue'
import FavoriteButton from '@/components/weather/FavoriteButton.vue'
import PrecipitationSummary from '@/components/weather/PrecipitationSummary.vue'
import TempChart from '@/components/weather/TempChart.vue'
import TempStrip from '@/components/weather/TempStrip.vue'
import WeatherBlockSkeleton from '@/components/weather/WeatherBlockSkeleton.vue'
import { useWeather } from '@/composables/useWeather'
import { useFavoritesStore } from '@/stores/favorites'
import { useThemeStore } from '@/stores/theme'
import type { City } from '@/types/city'
import type { HourPoint } from '@/types/forecast'
import { cityName } from '@/utils/city'

const props = defineProps<{
  city: City | null
  readonly?: boolean
  removable?: boolean
  primary?: boolean
  locating?: boolean
}>()

const emit = defineEmits<{
  'update:city': [city: City]
  remove: []
}>()

const favorites = useFavoritesStore()
const { current, hours, days, precipitation, loading, error, reload } = useWeather(
  toRef(props, 'city'),
)

const theme = useThemeStore()

watch(
  [current, () => props.primary],
  ([value, primary]) => {
    if (primary && value) theme.setDaylight(value.sunEvent.kind === 'sunset')
  },
  { immediate: true },
)

const mode = ref<'day' | 'days'>('day')

const modeOptions = computed(() => [
  { value: 'day', label: t('mode.day'), testId: 'mode-day' },
  { value: 'days', label: t('mode.days'), testId: 'mode-days' },
])

const isFavorite = computed(() => (props.city ? favorites.isFavorite(props.city.id) : false))

const searchCity = computed({
  get: () => props.city,
  set: (value) => {
    if (value) emit('update:city', value)
  },
})

const selectedKey = ref('')

const selectedDay = computed(
  () => days.value.find((d) => d.dateKey === selectedKey.value) ?? days.value[0] ?? null,
)

const selectedDateKey = computed({
  get: () => selectedDay.value?.dateKey ?? '',
  set: (value: string) => {
    selectedKey.value = value
  },
})

const selectedTitle = computed(() => {
  const day = selectedDay.value
  if (!day) return ''
  const date = `${weekdayName(day.weekday)}, ${day.day} ${monthName(day.month)}`
  return t('days.hourly', { date })
})

const shownHours = computed<HourPoint[]>(() =>
  mode.value === 'days' ? (selectedDay.value?.hours ?? []) : hours.value,
)

const chart = computed(() => ({
  labels: shownHours.value.map((h) => h.time),
  temps: shownHours.value.map((h) => h.temp),
  precipitation: shownHours.value.map((h) => h.rain + h.snow),
}))

const cells = computed(() =>
  shownHours.value.map((h) => ({ label: h.time, temp: h.temp, icon: h.icon, pop: h.pop })),
)
</script>

<template>
  <section
    class="block"
    :class="{ 'block--favorite': isFavorite }"
    data-testid="weather-block"
    :data-favorite="isFavorite"
  >
    <div class="block__top">
      <h2 v-if="readonly && city" class="block__title">{{ cityName(city) }}</h2>
      <CitySearch v-else v-model:city="searchCity" />
      <FavoriteButton v-if="city" :city="city" :readonly="readonly" />
      <BaseButton
        v-if="removable && !readonly"
        class="block__remove"
        :aria-label="t('block.delete.aria')"
        data-testid="block-remove"
        @click="emit('remove')"
      >
        ✕
      </BaseButton>
    </div>

    <WeatherBlockSkeleton v-if="locating" />
    <p v-else-if="!city" class="block__state">{{ t('blocks.empty') }}</p>
    <div v-else-if="error" class="block__state block__state--error">
      <span>{{ t('weather.error') }}</span>
      <BaseButton @click="reload">{{ t('common.retry') }}</BaseButton>
    </div>
    <WeatherBlockSkeleton v-else-if="loading && !current" />
    <template v-else-if="current">
      <BaseSegmented v-model="mode" class="block__mode" :options="modeOptions" />
      <template v-if="mode === 'days'">
        <DaysList v-model:selected="selectedDateKey" :days="days" />
        <h3 v-if="selectedDay" class="block__subtitle" data-testid="day-hourly-title">
          {{ selectedTitle }}
        </h3>
        <PrecipitationSummary :summary="selectedDay?.summary ?? null" empty-key="precip.noneDay" />
      </template>
      <template v-else>
        <CurrentCard :current="current" :city-name="readonly ? undefined : cityName(city)" />
        <PrecipitationSummary :summary="precipitation" />
      </template>
      <TempChart :labels="chart.labels" :temps="chart.temps" :precipitation="chart.precipitation" />
      <TempStrip :cells="cells" />
    </template>
  </section>
</template>

<style scoped>
.block {
  min-width: 0;
  padding: 16px;
  border-radius: var(--radius-block);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--line);
}

.block--favorite {
  box-shadow: 0 0 0 2px var(--ink);
}

.block__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.block__title {
  flex: 1;
  min-width: 0;
  font-size: 18px;
  font-weight: 700;
}

.block__subtitle {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 500;
}

.block__remove {
  color: var(--muted);
}

.block__mode {
  margin: 14px 0 12px;
}

.block__state {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  color: var(--muted);
  font-size: 14px;
}

.block__state--error {
  color: var(--ink);
}
</style>
