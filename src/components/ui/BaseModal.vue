<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

defineProps<{
  title: string
  testId?: string
}>()

const open = defineModel<boolean>('open', { default: false })
const dialog = ref<HTMLElement | null>(null)

function close() {
  open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(
  open,
  async (value) => {
    if (value) {
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      dialog.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" data-testid="modal-backdrop" @click.self="close">
      <div
        ref="dialog"
        class="modal"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        :data-testid="testId"
      >
        <h4 class="modal__title">{{ title }}</h4>
        <div class="modal__body">
          <slot />
        </div>
        <div v-if="$slots.actions" class="modal__actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--backdrop);
}

.modal {
  width: 100%;
  max-width: 340px;
  max-height: 100%;
  overflow-y: auto;
  padding: 18px;
  border-radius: var(--radius-modal);
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 0 0 1px var(--line);
  font-family: var(--font);
}

.modal:focus {
  outline: none;
}

.modal__title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 500;
}

.modal__body {
  font-size: 13px;
  color: var(--muted);
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
</style>
