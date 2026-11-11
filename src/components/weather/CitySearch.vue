<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from 'vue'
import { t } from '@/i18n'
import { useCitySearch } from '@/composables/useCitySearch'
import type { City } from '@/types/city'
import CitySearchList from '@/components/weather/CitySearchList.vue'
import { cityLabel } from '@/utils/city'

const city = defineModel<City | null>('city', { default: null })

const { query, results, loading, error, clear, retry } = useCitySearch()
const editing = ref(false)
const active = ref(-1)
const listId = useId()
const input = useTemplateRef<HTMLInputElement>('input')

watch(results, () => {
  active.value = -1
})

const inputValue = computed(() => {
  if (editing.value) return query.value
  return city.value ? cityLabel(city.value) : ''
})

const open = computed(() => editing.value && query.value.trim().length >= 2)

const listShown = computed(
  () => open.value && !loading.value && !error.value && results.value.length > 0,
)

const activeId = computed(() =>
  listShown.value && active.value >= 0 && active.value < results.value.length
    ? `${listId}-${active.value}`
    : undefined,
)

function close(): void {
  editing.value = false
  active.value = -1
  clear()
}

function select(next: City): void {
  city.value = next
  close()
}

function onFocusout(event: FocusEvent): void {
  const next = event.relatedTarget
  const root = event.currentTarget
  if (next instanceof Node && root instanceof Node && root.contains(next)) return
  close()
}

function onRetry(): void {
  input.value?.focus()
  retry()
}

function onInput(event: Event): void {
  editing.value = true
  active.value = -1
  query.value = (event.target as HTMLInputElement).value
}

function onFocus(event: FocusEvent): void {
  const input = event.target as HTMLInputElement
  input.select()
}

function move(step: number): void {
  const count = results.value.length
  active.value = (active.value + step + count) % count
}

function onEscape(): void {
  close()
  input.value?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && open.value && error.value) {
    event.preventDefault()
    retry()
    return
  }
  if (!listShown.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const picked = results.value[Math.max(active.value, 0)]
    if (picked) {
      event.preventDefault()
      select(picked)
    }
  }
}

defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div class="search" @focusout="onFocusout" @keydown.escape="onEscape">
    <input
      ref="input"
      class="search__input"
      data-testid="city-input"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-label="t('search.placeholder')"
      :aria-expanded="listShown"
      :aria-controls="listShown ? listId : undefined"
      :aria-activedescendant="activeId"
      :placeholder="t('search.placeholder')"
      :value="inputValue"
      @input="onInput"
      @focus="onFocus"
      @keydown="onKeydown"
    />
    <span v-if="loading" class="search__spinner" aria-hidden="true"></span>
    <CitySearchList
      v-if="open"
      :id="listId"
      :results="results"
      :loading="loading"
      :error="error"
      :active="active"
      @select="select"
      @hover="active = $event"
      @retry="onRetry"
    />
  </div>
</template>

<style scoped>
.search {
  position: relative;
  flex: 1;
  min-width: 0;
}

.search__input {
  width: 100%;
  padding: 9px 34px 9px 12px;
  border: 0;
  border-radius: var(--radius-control);
  background: var(--bg);
  color: var(--ink);
  font-size: 14px;
  text-overflow: ellipsis;
}

.search__input::placeholder {
  color: var(--muted);
}

.search__input:focus-visible {
  outline: 2px solid var(--ink);
  outline-offset: 1px;
}

.search__spinner {
  position: absolute;
  top: 50%;
  right: 12px;
  width: 14px;
  height: 14px;
  margin-top: -7px;
  border: 2px solid var(--line);
  border-top-color: var(--ink);
  border-radius: 50%;
  animation: search-spin 0.8s linear infinite;
  pointer-events: none;
}

@keyframes search-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .search__spinner {
    animation: none;
  }
}
</style>
