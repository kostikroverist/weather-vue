<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

defineProps<{
  title: string
  testId?: string
}>()

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

const open = defineModel<boolean>('open', { default: false })
const dialog = ref<HTMLElement | null>(null)

let returnFocus: HTMLElement | null = null
let savedOverflow: string | null = null

function close() {
  open.value = false
}

function trapTab(event: KeyboardEvent) {
  const root = dialog.value
  if (!root) return
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE))
  const first = items[0]
  const last = items[items.length - 1]
  if (!first || !last) {
    event.preventDefault()
    root.focus()
    return
  }
  const active = document.activeElement
  const inside = active instanceof Node && root.contains(active)
  if (event.shiftKey && (!inside || active === first || active === root)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (!inside || active === last)) {
    event.preventDefault()
    first.focus()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
  else if (event.key === 'Tab') trapTab(event)
}

function activate() {
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  savedOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeydown)
}

function deactivate() {
  document.removeEventListener('keydown', onKeydown)
  if (savedOverflow !== null) {
    document.body.style.overflow = savedOverflow
    savedOverflow = null
  }
  if (returnFocus?.isConnected) returnFocus.focus()
  returnFocus = null
}

watch(
  open,
  async (value) => {
    if (value) {
      activate()
      await nextTick()
      if (!open.value) return
      dialog.value?.focus()
    } else {
      deactivate()
    }
  },
  { immediate: true },
)

onBeforeUnmount(deactivate)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
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
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.96);
}

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
