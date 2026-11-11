<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import type { CurrentView } from '@/types/forecast'
import { formatTemp } from '@/utils/temperature'

const props = defineProps<{
  current: CurrentView
  cityName?: string
}>()

const description = computed(() => {
  const text = props.current.description
  return text.charAt(0).toUpperCase() + text.slice(1)
})

const stats = computed(() => [
  { label: t('weather.humidity'), value: `${props.current.humidity}%` },
  {
    label: t('weather.wind'),
    value: t('weather.windValue', { v: Math.round(props.current.windSpeed) }),
  },
  {
    label: t('weather.pressure'),
    value: t('weather.pressureValue', { v: props.current.pressure }),
  },
  {
    label: t(props.current.sunEvent.kind === 'sunrise' ? 'weather.sunrise' : 'weather.sunset'),
    value: props.current.sunEvent.time,
  },
])
</script>

<template>
  <div class="card">
    <div class="card__now">
      <span class="card__temp">{{ formatTemp(current.temp) }}</span>
      <img
        class="card__icon"
        :src="`https://openweathermap.org/img/wn/${current.icon}@2x.png`"
        :alt="current.description"
      />
      <div class="card__info">
        <div v-if="cityName" class="card__city">{{ cityName }}</div>
        <div class="card__desc">
          {{ t('weather.feelsLike', { desc: description, temp: formatTemp(current.feelsLike) }) }}
        </div>
      </div>
    </div>
    <dl class="card__stats">
      <div v-for="stat in stats" :key="stat.label" class="card__stat">
        <dt>{{ stat.label }}</dt>
        <dd>{{ stat.value }}</dd>
      </div>
    </dl>
  </div>
</template>

<style scoped>
.card__now {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card__temp {
  font-size: 46px;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1;
}

.card__icon {
  width: 52px;
  height: 52px;
  margin: -6px -4px;
}

.card__info {
  min-width: 0;
}

.card__city {
  font-size: 17px;
  font-weight: 500;
}

.card__desc {
  margin-top: 2px;
  color: var(--muted);
  font-size: 13px;
}

.card__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 12px 0 6px;
  font-size: 12px;
}

.card__stat dt {
  color: var(--muted);
}

.card__stat dd {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .card__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
