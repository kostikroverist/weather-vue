<script setup lang="ts">
import { computed, toRef, useTemplateRef, watch } from 'vue'
import { t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import CitySearch from '@/components/weather/CitySearch.vue'
import CurrentCard from '@/components/weather/CurrentCard.vue'
import FavoriteButton from '@/components/weather/FavoriteButton.vue'
import PrecipitationSummary from '@/components/weather/PrecipitationSummary.vue'
import RefreshBar from '@/components/weather/RefreshBar.vue'
import TempChart from '@/components/weather/TempChart.vue'
import TempStrip from '@/components/weather/TempStrip.vue'
import WeatherBlockSkeleton from '@/components/weather/WeatherBlockSkeleton.vue'
import WeatherDays from '@/components/weather/WeatherDays.vue'
import { useForecastView } from '@/composables/useForecastView'
import { useWeather } from '@/composables/useWeather'
import { useFavoritesStore } from '@/stores/favorites'
import { useThemeStore } from '@/stores/theme'
import type { City } from '@/types/city'
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
const { current, hours, days, todayKey, precipitation, loading, error, updatedAt, reload } =
  useWeather(toRef(props, 'city'))
const search = useTemplateRef('search')

defineExpose({ focusSearch: () => search.value?.focus() })

const theme = useThemeStore()

watch(
  [current, () => props.primary],
  ([value, primary]) => {
    if (primary && value) theme.setDaylight(value.isDay)
  },
  { immediate: true },
)

const { mode, selectedKey, series } = useForecastView(hours, days, () => props.city?.id)

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
      <CitySearch v-else ref="search" v-model:city="searchCity" />
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
      <BaseSegmented
        v-model="mode"
        class="block__mode"
        :options="modeOptions"
        :aria-label="t('mode.aria')"
      />
      <RefreshBar :updated-at="updatedAt" :loading="loading" @refresh="reload" />
      <WeatherDays
        v-if="mode === 'days'"
        v-model:selected="selectedKey"
        :days="days"
        :today-key="todayKey"
      />
      <template v-else>
        <CurrentCard :current="current" :city-name="readonly ? undefined : cityName(city)" />
        <PrecipitationSummary :summary="precipitation" />
      </template>
      <TempChart
        :labels="series.labels"
        :temps="series.temps"
        :precipitation="series.precipitation"
      />
      <TempStrip :cells="series.cells" />
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
