<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { t } from '@/i18n'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import { useFavoritesStore } from '@/stores/favorites'

const favorites = useFavoritesStore()
</script>

<template>
  <main class="favorites container">
    <div v-if="favorites.count" class="favorites__grid">
      <WeatherBlock v-for="city in favorites.items" :key="city.id" :city="city" readonly />
    </div>
    <div v-else class="favorites__empty" data-testid="favorites-empty">
      <p>{{ t('fav.empty') }}</p>
      <RouterLink to="/" class="favorites__link">{{ t('fav.emptyLink') }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.favorites {
  padding-bottom: 32px;
}

.favorites__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.favorites__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 24px;
  border-radius: var(--radius-block);
  background: var(--surface);
  box-shadow: 0 0 0 1px var(--line);
  color: var(--muted);
}

.favorites__link {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: var(--surface);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
}

@media (min-width: 900px) {
  .favorites__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
