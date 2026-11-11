<script setup lang="ts">
import { computed } from 'vue'
import { t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useFavoritesStore } from '@/stores/favorites'
import type { City } from '@/types/city'

const props = defineProps<{
  city: City
  readonly?: boolean
}>()

const favorites = useFavoritesStore()

const active = computed(() => favorites.isFavorite(props.city.id))

const label = computed(() => {
  if (props.readonly) return t('fav.remove')
  return active.value ? t('fav.added') : t('fav.add')
})
</script>

<template>
  <BaseButton
    :variant="active ? 'accent' : 'secondary'"
    :aria-pressed="active"
    data-testid="fav-button"
    @click="favorites.toggle(city)"
  >
    {{ label }}
  </BaseButton>
</template>
