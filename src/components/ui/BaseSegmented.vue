<script setup lang="ts">
defineProps<{
  options: { value: string; label: string; testId?: string }[]
}>()

const model = defineModel<string>()
</script>

<template>
  <div class="segmented" role="group">
    <button
      v-for="option in options"
      :key="option.value"
      class="segmented__item"
      :class="{ 'segmented__item--active': option.value === model }"
      type="button"
      :aria-pressed="option.value === model"
      :data-testid="option.testId"
      @click="model = option.value"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  display: inline-flex;
  gap: 4px;
}

.segmented__item {
  padding: 5px 12px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--muted);
  font-family: var(--font);
  font-size: 12px;
  cursor: pointer;
}

.segmented__item:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.segmented__item--active {
  background: var(--bg);
  color: var(--ink);
  font-weight: 500;
}
</style>
