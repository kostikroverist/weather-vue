<script setup lang="ts">
import { t } from '@/i18n'
import type { City } from '@/types/city'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { cityOptionLabel } from '@/utils/city'

defineProps<{
  id: string
  results: City[]
  loading: boolean
  error: boolean
  active: number
}>()

const emit = defineEmits<{
  select: [city: City]
  hover: [index: number]
  retry: []
}>()
</script>

<template>
  <div class="dropdown">
    <div v-if="loading" class="dropdown__loading" role="status" :aria-label="t('common.loading')">
      <BaseSkeleton v-for="n in 3" :key="n" height="18px" />
    </div>
    <div v-else-if="error" class="dropdown__error">
      <p class="dropdown__state">{{ t('search.error') }}</p>
      <BaseButton data-testid="city-retry" @mousedown.prevent @click="emit('retry')">
        {{ t('common.retry') }}
      </BaseButton>
    </div>
    <p v-else-if="!results.length" class="dropdown__state">{{ t('search.notFound') }}</p>
    <ul v-else :id="id" class="dropdown__list" role="listbox">
      <li
        v-for="(item, index) in results"
        :id="`${id}-${index}`"
        :key="`${item.id}-${index}`"
        class="dropdown__option"
        :class="{ 'dropdown__option--active': index === active }"
        role="option"
        :aria-selected="index === active"
        data-testid="city-option"
        @mousedown.prevent="emit('select', item)"
        @mouseenter="emit('hover', index)"
      >
        {{ cityOptionLabel(item) }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  padding: 4px;
  border-radius: var(--radius-control);
  background: var(--surface);
  box-shadow:
    0 0 0 1px var(--line),
    0 8px 24px var(--backdrop);
}

.dropdown__loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
}

.dropdown__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dropdown__state {
  padding: 8px 10px;
  color: var(--muted);
  font-size: 13px;
}

.dropdown__option {
  padding: 8px 10px;
  border-radius: var(--radius-control);
  font-size: 14px;
  cursor: pointer;
}

.dropdown__option--active {
  background: var(--bg);
}
</style>
