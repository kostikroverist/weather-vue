<script setup lang="ts">
import { computed } from 'vue'
import { formatTime, t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps<{
  updatedAt: number | null
  loading: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()

const label = computed(() => {
  if (props.updatedAt === null) return ''
  return t('weather.updatedAt', { time: formatTime(props.updatedAt) })
})

function onClick(): void {
  if (!props.loading) emit('refresh')
}
</script>

<template>
  <div class="refresh">
    <span v-if="updatedAt !== null" class="refresh__time" data-testid="updated-at">{{ label }}</span>
    <BaseButton
      class="refresh__button"
      :aria-label="t('weather.refresh')"
      :aria-disabled="loading"
      data-testid="refresh"
      @click="onClick"
    >
      <svg
        class="refresh__icon"
        :class="{ 'refresh__icon--spin': loading }"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    </BaseButton>
  </div>
</template>

<style scoped>
.refresh {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.refresh__time {
  color: var(--muted);
  font-size: 12px;
}

.refresh .refresh__button {
  padding: 6px;
  color: var(--muted);
}

.refresh .refresh__button[aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh__icon {
  display: block;
}

.refresh__icon--spin {
  animation: refresh-spin 0.8s linear infinite;
}

@keyframes refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .refresh__icon--spin {
    animation: none;
  }
}
</style>
