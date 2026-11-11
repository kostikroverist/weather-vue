<script setup lang="ts">
import { computed } from 'vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import { t } from '@/i18n'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

const theme = useThemeStore()

const options = computed(() => [
  { value: 'auto', label: t('theme.auto'), testId: 'theme-auto' },
  { value: 'light', label: t('theme.light'), testId: 'theme-light' },
  { value: 'dark', label: t('theme.dark'), testId: 'theme-dark' },
])

const model = computed({
  get: () => theme.mode,
  set: (value: string | undefined) => {
    if (value === 'auto' || value === 'light' || value === 'dark') theme.setMode(value as ThemeMode)
  },
})
</script>

<template>
  <BaseSegmented v-model="model" :options="options" :aria-label="t('theme.label')" />
</template>
