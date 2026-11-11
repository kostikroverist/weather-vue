<script setup lang="ts">
import { monthName, t, weekdayName } from '@/i18n'
import type { DayPoint } from '@/types/forecast'
import { formatTemp } from '@/utils/temperature'

defineProps<{
  days: DayPoint[]
}>()

const selected = defineModel<string>('selected', { default: '' })
</script>

<template>
  <div>
    <div class="days">
      <button
        v-for="item in days"
        :key="item.dateKey"
        type="button"
        class="day"
        :class="{ 'day--selected': item.dateKey === selected }"
        :aria-pressed="item.dateKey === selected"
        data-testid="day-tile"
        @click="selected = item.dateKey"
      >
        <span class="day__name">{{ weekdayName(item.weekday) }}</span>
        <small class="day__muted">{{ item.day }} {{ monthName(item.month) }}</small>
        <img
          class="day__icon"
          :src="`https://openweathermap.org/img/wn/${item.icon}@2x.png`"
          alt=""
        />
        <b class="day__avg">{{ formatTemp(item.avg) }}</b>
        <small class="day__muted">{{ item.min }}° / {{ item.max }}°</small>
        <span class="day__pop" :class="{ 'day__pop--none': item.pop === 0 }">
          <svg class="day__drop" viewBox="0 0 10 13" aria-hidden="true">
            <path d="M5 0C5 0 0 6.5 0 8.4A5 5 0 0 0 10 8.4C10 6.5 5 0 5 0Z" fill="currentColor" />
          </svg>
          {{ item.pop }}%
        </span>
      </button>
    </div>
    <p class="days__note">{{ t('days.note') }}</p>
  </div>
</template>

<style scoped>
.days {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  margin: 4px 0 6px;
}

.day {
  border: 0;
  color: var(--ink);
  font-family: var(--font);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 6px 2px;
  border-radius: 10px;
  background: var(--bg);
  text-align: center;
}

.day:hover {
  box-shadow: inset 0 0 0 1px var(--line);
}

.day:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.day--selected,
.day--selected:hover {
  background: var(--surface);
  box-shadow: inset 0 0 0 1.5px var(--ink);
}

.day__name {
  font-size: 12px;
  font-weight: 500;
}

.day__muted {
  color: var(--muted);
  font-size: 10px;
  white-space: nowrap;
}

.day__icon {
  width: 34px;
  height: 34px;
  margin: 0 0 -2px;
}

.day__avg {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.day__pop {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--rain);
  font-size: 10px;
  font-weight: 500;
}

.day__pop--none {
  color: var(--muted);
  font-weight: 400;
}

.day__drop {
  width: 7px;
  height: 9px;
}

.days__note {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 12px;
}

@media (min-width: 480px) {
  .day {
    padding: 8px 4px;
  }

  .day__name {
    font-size: 13px;
  }

  .day__muted,
  .day__pop {
    font-size: 11px;
  }

  .day__icon {
    width: 44px;
    height: 44px;
  }

  .day__avg {
    font-size: 20px;
  }
}
</style>
