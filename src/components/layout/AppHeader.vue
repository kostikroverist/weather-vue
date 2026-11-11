<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { t } from '@/i18n'
import LocaleToggle from '@/components/layout/LocaleToggle.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import { useFavoritesStore } from '@/stores/favorites'

const favorites = useFavoritesStore()
</script>

<template>
  <header class="header container">
    <RouterLink to="/" class="header__logo">{{ t('app.title') }}</RouterLink>
    <div class="header__controls">
      <nav class="header__tabs">
        <RouterLink to="/" class="header__tab" exact-active-class="header__tab--active">
          {{ t('nav.home') }}
        </RouterLink>
        <RouterLink
          to="/favorites"
          class="header__tab"
          exact-active-class="header__tab--active"
          data-testid="tab-favorites"
        >
          {{ t('nav.favorites') }}
          <span v-if="favorites.count" class="header__badge" data-testid="favorites-badge">{{
            favorites.count
          }}</span>
        </RouterLink>
      </nav>
      <LocaleToggle />
      <ThemeToggle />
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 20px;
  padding-bottom: 16px;
}

.header__logo {
  font-size: 20px;
  font-weight: 700;
  text-decoration: none;
}

.header__controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.header__tabs {
  display: flex;
  gap: 6px;
}

.header__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  color: var(--muted);
  font-size: 14px;
  text-decoration: none;
}

.header__tab:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 2px;
}

.header__tab--active {
  background: var(--ink);
  color: var(--surface);
}

.header__badge {
  min-width: 18px;
  padding: 0 5px;
  border-radius: var(--radius-pill);
  background: var(--fav-bg);
  color: var(--fav-ink);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
}
</style>
