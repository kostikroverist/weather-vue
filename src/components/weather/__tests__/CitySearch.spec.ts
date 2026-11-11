import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import CitySearch from '@/components/weather/CitySearch.vue'
import type { City } from '@/types/city'
import { KYIV } from '@/utils/city'

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

const query = ref('')
const results = ref<City[]>([])
const loading = ref(false)
const error = ref(false)
const clear = vi.fn<() => void>()
const retry = vi.fn<() => void>()

vi.mock('@/composables/useCitySearch', () => ({
  useCitySearch: () => ({ query, results, loading, error, clear, retry }),
}))

async function typed(text = 'Ки') {
  const wrapper = mount(CitySearch)
  const input = wrapper.get('[data-testid="city-input"]')
  await input.setValue(text)
  return { wrapper, input }
}

describe('CitySearch', () => {
  beforeEach(() => {
    query.value = ''
    results.value = []
    loading.value = false
    error.value = false
    clear.mockReset()
    retry.mockReset()
  })

  it('has aria-label and no aria-controls without a list', () => {
    const wrapper = mount(CitySearch)
    const input = wrapper.get('[data-testid="city-input"]')
    expect(input.attributes('aria-label')).toBe('Пошук міста')
    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('has no aria-controls while loading', async () => {
    loading.value = true
    const { input } = await typed()
    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('open list: aria-controls matches the listbox id', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    const list = wrapper.get('[role="listbox"]')
    expect(input.attributes('aria-controls')).toBe(list.attributes('id'))
    expect(input.attributes('aria-expanded')).toBe('true')
    const options = wrapper.findAll('[role="option"]')
    expect(options).toHaveLength(2)
    expect(new Set(options.map((o) => o.attributes('id'))).size).toBe(2)
    expect(options[0]?.attributes('aria-selected')).toBe('false')
  })

  it('arrow down highlights an option and sets aria-activedescendant', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'ArrowDown' })
    const first = wrapper.findAll('[role="option"]')[0]
    expect(input.attributes('aria-activedescendant')).toBe(first?.attributes('id'))
    expect(first?.attributes('aria-selected')).toBe('true')
  })

  it('Enter without a highlighted item selects the first one', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:city')?.[0]).toEqual([KYIV])
  })

  it('arrows and Enter do nothing while loading', async () => {
    results.value = [KYIV]
    loading.value = true
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:city')).toBeUndefined()
  })

  it('in the error state the retry button calls retry', async () => {
    error.value = true
    const { wrapper } = await typed()
    expect(wrapper.text()).toContain('Не вдалося завантажити список міст')
    const button = wrapper.get('[data-testid="city-retry"]')
    expect(button.text()).toBe('Спробувати ще')
    await button.trigger('click')
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('Tab from the input to the retry button does not close the list', async () => {
    error.value = true
    const { wrapper, input } = await typed()
    const button = wrapper.get('[data-testid="city-retry"]')
    await input.trigger('focusout', { relatedTarget: button.element })
    expect(clear).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="city-retry"]').exists()).toBe(true)
  })

  it('focus moving outside closes the list', async () => {
    results.value = [KYIV]
    const { wrapper, input } = await typed()
    await input.trigger('focusout', { relatedTarget: document.body })
    expect(clear).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('Escape on the retry button closes the list', async () => {
    error.value = true
    const { wrapper } = await typed()
    await wrapper.get('[data-testid="city-retry"]').trigger('keydown', { key: 'Escape' })
    expect(clear).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="city-retry"]').exists()).toBe(false)
  })

  it('Escape in the input closes the list', async () => {
    results.value = [KYIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'Escape' })
    expect(clear).toHaveBeenCalled()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('Enter in the error state calls retry', async () => {
    error.value = true
    const { input } = await typed()
    await input.trigger('keydown', { key: 'Enter' })
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('updating results without input resets the highlight', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'ArrowDown' })
    results.value = [LVIV, KYIV]
    await nextTick()
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    const selected = wrapper
      .findAll('[role="option"]')
      .filter((o) => o.attributes('aria-selected') === 'true')
    expect(selected).toHaveLength(0)
  })
})
