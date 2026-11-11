<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
import FavoritesLimitModal from '@/components/modals/FavoritesLimitModal.vue'
import { useBlocksStore } from '@/stores/blocks'
import { useThemeStore } from '@/stores/theme'

useThemeStore()
const blocks = useBlocksStore()

onMounted(() => {
  void blocks.initFromIp()
})
</script>

<template>
  <AppHeader />
  <RouterView />
  <FavoritesLimitModal />
</template>
