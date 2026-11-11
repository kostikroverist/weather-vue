<script setup lang="ts">
withDefaults(
  defineProps<{
    width?: string
    height?: string
    radius?: string
  }>(),
  { width: '100%', height: '16px', radius: 'var(--radius-control)' },
)
</script>

<template>
  <span class="skeleton" aria-hidden="true" :style="{ width, height, borderRadius: radius }"></span>
</template>

<style scoped>
.skeleton {
  display: block;
  max-width: 100%;
  background: linear-gradient(
    90deg,
    var(--bg) 0%,
    color-mix(in srgb, var(--bg) 50%, var(--line-soft)) 50%,
    var(--bg) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}
</style>
