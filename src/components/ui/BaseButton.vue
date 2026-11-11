<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'accent' | 'link'
    pill?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'secondary', pill: false, disabled: false, type: 'button' },
)
</script>

<template>
  <button
    class="base-button"
    :class="[`base-button--${variant}`, { 'base-button--pill': pill }]"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
}

.base-button:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.base-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.base-button--pill {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
}

.base-button--primary {
  background: var(--ink);
  color: var(--surface);
}

.base-button--accent {
  background: var(--fav-bg);
  color: var(--fav-ink);
}

.base-button--link {
  padding: 0;
  background: transparent;
  color: var(--muted);
  font-weight: 400;
  text-decoration: underline;
}
</style>
