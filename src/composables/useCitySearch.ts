import { onScopeDispose, ref, watch } from 'vue'
import axios from 'axios'
import { locale } from '@/i18n'
import { searchCities } from '@/services/geo.service'
import type { City } from '@/types/city'

const DEBOUNCE_MS = 300
const MIN_LENGTH = 2

export function useCitySearch() {
  const query = ref('')
  const results = ref<City[]>([])
  const loading = ref(false)
  const error = ref(false)

  let timer: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | null = null

  function cancel(): void {
    clearTimeout(timer)
    controller?.abort()
    controller = null
    loading.value = false
  }

  async function search(q: string): Promise<void> {
    controller?.abort()
    const own = new AbortController()
    controller = own
    loading.value = true
    error.value = false
    try {
      const found = await searchCities(q, own.signal)
      if (!own.signal.aborted) results.value = found
    } catch (e) {
      if (!own.signal.aborted && !axios.isCancel(e)) error.value = true
    } finally {
      if (!own.signal.aborted) loading.value = false
    }
  }

  watch(query, (value) => {
    clearTimeout(timer)
    const q = value.trim()
    if (q.length < MIN_LENGTH) {
      cancel()
      results.value = []
      error.value = false
      return
    }
    loading.value = true
    timer = setTimeout(() => search(q), DEBOUNCE_MS)
  })

  watch(locale, () => {
    const q = query.value.trim()
    if (q.length < MIN_LENGTH) return
    clearTimeout(timer)
    void search(q)
  })

  function clear(): void {
    cancel()
    query.value = ''
    results.value = []
    error.value = false
  }

  onScopeDispose(cancel)

  return { query, results, loading, error, clear }
}
