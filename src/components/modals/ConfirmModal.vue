<script setup lang="ts">
import { t } from '@/i18n'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

defineProps<{
  title: string
  text?: string
  confirmLabel: string
}>()

const emit = defineEmits<{ confirm: [] }>()
const open = defineModel<boolean>('open', { default: false })

function onConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <BaseModal v-model:open="open" :title="title" test-id="confirm-modal">
    <p v-if="text" class="confirm-text">{{ text }}</p>
    <template #actions>
      <BaseButton pill @click="open = false">{{ t('common.cancel') }}</BaseButton>
      <BaseButton variant="primary" pill data-testid="confirm-modal-confirm" @click="onConfirm">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-text {
  margin: 0;
}
</style>
