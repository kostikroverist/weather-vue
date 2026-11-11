<script setup lang="ts">
import { computed, ref } from 'vue'
import { t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import { BLOCKS_MAX, useBlocksStore } from '@/stores/blocks'
import { cityName } from '@/utils/city'

const store = useBlocksStore()
const pendingRemoveId = ref<string | null>(null)

const pendingBlock = computed(() => store.blocks.find((b) => b.id === pendingRemoveId.value))

const confirmOpen = computed({
  get: () => pendingRemoveId.value !== null,
  set: (value) => {
    if (!value) pendingRemoveId.value = null
  },
})

const confirmTitle = computed(() => {
  const city = pendingBlock.value?.city
  return city ? t('block.delete.title', { city: cityName(city) }) : t('block.delete.titleEmpty')
})

const confirmText = computed(() => (pendingBlock.value?.city ? t('block.delete.text') : undefined))

function confirmRemove(): void {
  if (pendingRemoveId.value) store.remove(pendingRemoveId.value)
}
</script>

<template>
  <main class="home container">
    <div class="home__bar">
      <span class="home__count" data-testid="blocks-count">
        {{ t('blocks.count', { n: store.blocks.length, max: BLOCKS_MAX }) }}
      </span>
      <div class="home__add">
        <span v-if="!store.canAdd" class="home__hint">{{ t('blocks.max') }}</span>
        <BaseButton
          variant="primary"
          :disabled="!store.canAdd"
          data-testid="add-block"
          @click="store.add()"
        >
          {{ t('blocks.add') }}
        </BaseButton>
      </div>
    </div>

    <TransitionGroup tag="div" name="block" class="home__grid">
      <WeatherBlock
        v-for="(block, index) in store.blocks"
        :key="block.id"
        :city="block.city"
        :removable="store.canRemove"
        :primary="index === 0"
        :locating="index === 0 && store.locating"
        @update:city="store.setCity(block.id, $event)"
        @remove="pendingRemoveId = block.id"
      />
    </TransitionGroup>

    <ConfirmModal
      v-model:open="confirmOpen"
      :title="confirmTitle"
      :text="confirmText"
      :confirm-label="t('common.delete')"
      @confirm="confirmRemove"
    />
  </main>
</template>

<style scoped>
.home {
  padding-bottom: 32px;
}

.home__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.home__count,
.home__hint {
  color: var(--muted);
  font-size: 13px;
}

.home__add {
  display: flex;
  align-items: center;
  gap: 10px;
}

.home__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 14px;
}

.block-enter-active,
.block-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.block-enter-from,
.block-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (min-width: 900px) {
  .home__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
