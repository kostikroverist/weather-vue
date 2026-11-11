<script setup lang="ts">
import { formatTemp, temperatureColor } from '@/utils/temperature'

defineProps<{
  cells: { label: string; temp: number; icon?: string; pop?: number }[]
}>()

function iconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`
}
</script>

<template>
  <div class="strip" :style="{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }">
    <div
      v-for="(cell, index) in cells"
      :key="`${index}-${cell.label}`"
      class="strip__cell"
      :style="{ background: temperatureColor(cell.temp) }"
      data-testid="strip-cell"
    >
      <span>{{ cell.label }}</span>
      <img v-if="cell.icon" class="strip__icon" :src="iconUrl(cell.icon)" alt="" />
      <b class="strip__temp">{{ formatTemp(cell.temp) }}</b>
      <span
        v-if="cell.pop !== undefined"
        class="strip__pop"
        :class="{ 'strip__pop--none': cell.pop === 0 }"
      >
        <svg class="strip__drop" viewBox="0 0 10 13" aria-hidden="true">
          <path d="M5 0C5 0 0 6.5 0 8.4A5 5 0 0 0 10 8.4C10 6.5 5 0 5 0Z" fill="currentColor" />
        </svg>
        {{ cell.pop }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
.strip {
  display: grid;
  margin-top: 8px;
  border-radius: var(--radius-control);
  overflow: hidden;
}

.strip__cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  min-width: 0;
  padding: 5px 2px;
  color: var(--strip-ink);
  font-size: 10px;
}

.strip__icon {
  width: 24px;
  height: 24px;
  margin: -4px 0;
}

.strip__temp {
  font-size: 13px;
}

.strip__pop {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  color: var(--strip-rain);
  font-size: 9px;
  font-weight: 500;
}

.strip__pop--none {
  color: var(--strip-muted);
  font-weight: 400;
}

.strip__drop {
  width: 7px;
  height: 9px;
  flex: 0 0 auto;
}

@media (min-width: 480px) {
  .strip__cell {
    padding: 5px 4px;
  }

  .strip__icon {
    width: 30px;
    height: 30px;
  }

  .strip__pop {
    gap: 3px;
    font-size: 11px;
  }

  .strip__drop {
    width: 9px;
    height: 11px;
  }
}
</style>
