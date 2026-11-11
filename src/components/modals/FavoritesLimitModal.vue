<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { cityName } from '@/utils/city'

const favorites = useFavoritesStore()

const pendingName = computed(() => (favorites.pendingCity ? cityName(favorites.pendingCity) : ''))

const open = computed({
  get: () => favorites.pendingCity !== null,
  set: (value) => {
    if (!value) favorites.cancelPending()
  },
})
</script>

<template>
  <BaseModal v-model:open="open" :title="t('fav.limit.title')" test-id="limit-modal">
    <p class="limit__text">
      {{ t('fav.limit.text', { city: pendingName }) }}
    </p>
    <ul class="limit__list">
      <li v-for="city in favorites.items" :key="city.id" class="limit__item">
        <span>{{ cityName(city) }}</span>
        <BaseButton
          variant="link"
          :aria-label="t('fav.limit.removeAria', { city: cityName(city) })"
          @click="favorites.remove(city.id)"
        >
          {{ t('common.delete') }}
        </BaseButton>
      </li>
    </ul>
    <template #actions>
      <BaseButton pill @click="favorites.cancelPending()">{{ t('common.cancel') }}</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.limit__text {
  margin: 0;
}

.limit__list {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}

.limit__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid var(--line-soft);
  color: var(--ink);
  font-size: 14px;
}
</style>
