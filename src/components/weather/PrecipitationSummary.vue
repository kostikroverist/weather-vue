<script setup lang="ts">
import type { MessageKey } from '@/i18n'
import type { PrecipitationSummary } from '@/types/forecast'
import { precipitationText } from '@/utils/precipitation'

defineProps<{
  summary: PrecipitationSummary | null
  emptyKey?: MessageKey
}>()
</script>

<template>
  <p class="precip" :class="{ 'precip--dry': !summary }" data-testid="precip-summary">
    <svg class="precip__drop" viewBox="0 0 10 13" aria-hidden="true">
      <path d="M5 0C5 0 0 6.5 0 8.4A5 5 0 0 0 10 8.4C10 6.5 5 0 5 0Z" fill="currentColor" />
    </svg>
    {{ precipitationText(summary, emptyKey) }}
  </p>
</template>

<style scoped>
.precip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 8px;
  color: var(--rain);
  font-size: 13px;
  font-weight: 500;
}

.precip--dry {
  color: var(--muted);
  font-weight: 400;
}

.precip__drop {
  width: 11px;
  height: 14px;
  flex: 0 0 auto;
}
</style>
