<script setup lang="ts">
import { computed } from 'vue'
import { LOCALES, isLocale, locale, t } from '@/i18n'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'

const options = computed(() =>
  LOCALES.map((value) => ({
    value,
    label: t(`locale.${value}`),
    testId: `locale-${value}`,
  })),
)

const model = computed({
  get: () => locale.value,
  set: (value: string | undefined) => {
    if (isLocale(value)) locale.value = value
  },
})
</script>

<template>
  <BaseSegmented
    v-model="model"
    class="locale"
    :options="options"
    :aria-label="t('locale.label')"
  />
</template>

<style scoped>
.locale {
  padding: 3px;
  border-radius: var(--radius-control);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--line);
}
</style>
