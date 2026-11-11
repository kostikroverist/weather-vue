<script setup lang="ts">
import { computed } from 'vue'
import { monthName, t, weekdayName } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import DaysList from '@/components/weather/DaysList.vue'
import PrecipitationSummary from '@/components/weather/PrecipitationSummary.vue'
import type { DayPoint } from '@/types/forecast'

const props = defineProps<{
  days: DayPoint[]
  todayKey: string
}>()

const selected = defineModel<string>('selected', { default: '' })

const day = computed(() => props.days.find((d) => d.dateKey === selected.value) ?? null)

const title = computed(() => {
  if (!day.value) return ''
  const { weekday, day: date, month } = day.value
  return t('days.hourly', { date: `${weekdayName(weekday)}, ${date} ${monthName(month)}` })
})
</script>

<template>
  <DaysList v-model:selected="selected" :days="days" :today-key="todayKey" />
  <template v-if="day">
    <div class="hourly">
      <h3 class="hourly__title" data-testid="day-hourly-title">{{ title }}</h3>
      <BaseButton variant="link" data-testid="days-back" @click="selected = ''">
        {{ t('days.back') }}
      </BaseButton>
    </div>
    <PrecipitationSummary :summary="day.summary" empty-key="precip.noneDay" />
  </template>
</template>

<style scoped>
.hourly {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.hourly__title {
  font-size: 14px;
  font-weight: 500;
}
</style>
