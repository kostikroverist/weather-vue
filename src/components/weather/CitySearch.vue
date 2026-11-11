<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { t } from '@/i18n'
import { useCitySearch } from '@/composables/useCitySearch'
import type { City } from '@/types/city'
import BaseSkeleton from '@/components/ui/BaseSkeleton.vue'
import { cityLabel, cityOptionLabel } from '@/utils/city'

const city = defineModel<City | null>('city', { default: null })

const { query, results, loading, error, clear } = useCitySearch()
const editing = ref(false)
const active = ref(-1)
const listId = useId()

const inputValue = computed(() => {
  if (editing.value) return query.value
  return city.value ? cityLabel(city.value) : ''
})

const open = computed(() => editing.value && query.value.trim().length >= 2)

const activeId = computed(() =>
  open.value && active.value >= 0 ? `${listId}-${active.value}` : undefined,
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
  if (!count) return
  active.value = (active.value + step + count) % count
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    close()
    return
  }
  if (!open.value) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    const picked = results.value[active.value]
    if (picked) {
      event.preventDefault()
      select(picked)
    }
  }
}
</script>

<template>
  <div class="search">
    <input
      class="search__input"
      data-testid="city-input"
      type="text"
      role="combobox"
      autocomplete="off"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="activeId"
      :placeholder="t('search.placeholder')"
      :value="inputValue"
      @input="onInput"
      @focus="onFocus"
      @blur="close"
      @keydown="onKeydown"
    />
    <span v-if="loading" class="search__spinner" aria-hidden="true"></span>
    <div v-if="open" class="search__dropdown">
      <div v-if="loading" class="search__loading" role="status" :aria-label="t('common.loading')">
        <BaseSkeleton v-for="n in 3" :key="n" height="18px" />
      </div>
      <p v-else-if="error" class="search__state">{{ t('search.error') }}</p>
      <p v-else-if="!results.length" class="search__state">{{ t('search.notFound') }}</p>
      <ul v-else :id="listId" class="search__list" role="listbox">
        <li
          v-for="(item, index) in results"
          :id="`${listId}-${index}`"
          :key="`${item.id}-${index}`"
          class="search__option"
          :class="{ 'search__option--active': index === active }"
          role="option"
          :aria-selected="index === active"
          data-testid="city-option"
          @mousedown.prevent="select(item)"
          @mouseenter="active = index"
        >
          {{ cityOptionLabel(item) }}
        </li>
      </ul>
    </div>
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

.search__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  padding: 4px;
  border-radius: var(--radius-control);
  background: var(--surface);
  box-shadow:
    0 0 0 1px var(--line),
    0 8px 24px var(--backdrop);
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

.search__loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
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

.search__state {
  padding: 8px 10px;
  color: var(--muted);
  font-size: 13px;
}

.search__option {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.search__option--active {
  background: var(--bg);
}
</style>
