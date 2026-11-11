<script setup lang="ts">
import { t } from '@/i18n'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
</script>

<template>
  <div class="skel" data-testid="block-skeleton" role="status" :aria-label="t('common.loading')">
    <div class="skel__mode">
      <BaseSkeleton width="132px" height="28px" />
    </div>
    <div class="skel__now">
      <BaseSkeleton width="96px" height="46px" />
      <BaseSkeleton width="52px" height="52px" radius="50%" />
      <div class="skel__info">
        <BaseSkeleton width="120px" height="17px" />
        <BaseSkeleton width="180px" height="13px" />
      </div>
    </div>
    <div class="skel__stats">
      <div v-for="n in 4" :key="n" class="skel__stat">
        <BaseSkeleton width="60%" height="12px" />
        <BaseSkeleton width="80%" height="14px" />
      </div>
    </div>
    <BaseSkeleton class="skel__precip" width="70%" height="18px" />
    <BaseSkeleton height="180px" radius="var(--radius-block)" />
    <BaseSkeleton class="skel__strip" height="56px" />
  </div>
</template>

<style scoped>
.skel__mode {
  margin: 14px 0 12px;
}

.skel__now {
  display: flex;
  align-items: center;
  gap: 10px;
}

.skel__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.skel__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: 12px 0 6px;
}

.skel__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skel__precip {
  margin: 8px 0 12px;
}

.skel__strip {
  margin-top: 8px;
}

@media (max-width: 480px) {
  .skel__stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
