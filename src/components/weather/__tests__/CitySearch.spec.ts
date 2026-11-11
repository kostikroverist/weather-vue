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

  it('має aria-label і без списку не має aria-controls', () => {
    const wrapper = mount(CitySearch)
    const input = wrapper.get('[data-testid="city-input"]')
    expect(input.attributes('aria-label')).toBe('Пошук міста')
    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('під час завантаження aria-controls відсутній', async () => {
    loading.value = true
    const { input } = await typed()
    expect(input.attributes('aria-controls')).toBeUndefined()
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('відкритий список: aria-controls збігається з id listbox', async () => {
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

  it('стрілка вниз підсвічує опцію і ставить aria-activedescendant', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'ArrowDown' })
    const first = wrapper.findAll('[role="option"]')[0]
    expect(input.attributes('aria-activedescendant')).toBe(first?.attributes('id'))
    expect(first?.attributes('aria-selected')).toBe('true')
  })

  it('Enter без підсвіченого пункту вибирає перший', async () => {
    results.value = [KYIV, LVIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:city')?.[0]).toEqual([KYIV])
  })

  it('під час завантаження стрілки й Enter не діють', async () => {
    results.value = [KYIV]
    loading.value = true
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBeUndefined()
    await input.trigger('keydown', { key: 'Enter' })
    expect(wrapper.emitted('update:city')).toBeUndefined()
  })

  it('у стані помилки кнопка повтору викликає retry', async () => {
    error.value = true
    const { wrapper } = await typed()
    expect(wrapper.text()).toContain('Не вдалося завантажити список міст')
    const button = wrapper.get('[data-testid="city-retry"]')
    expect(button.text()).toBe('Спробувати ще')
    await button.trigger('click')
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('Tab з інпута на кнопку повтору не закриває список', async () => {
    error.value = true
    const { wrapper, input } = await typed()
    const button = wrapper.get('[data-testid="city-retry"]')
    await input.trigger('focusout', { relatedTarget: button.element })
    expect(clear).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="city-retry"]').exists()).toBe(true)
  })

  it('втрата фокусу назовні закриває список', async () => {
    results.value = [KYIV]
    const { wrapper, input } = await typed()
    await input.trigger('focusout', { relatedTarget: document.body })
    expect(clear).toHaveBeenCalledTimes(1)
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('Escape на кнопці повтору закриває список', async () => {
    error.value = true
    const { wrapper } = await typed()
    await wrapper.get('[data-testid="city-retry"]').trigger('keydown', { key: 'Escape' })
    expect(clear).toHaveBeenCalled()
    expect(wrapper.find('[data-testid="city-retry"]').exists()).toBe(false)
  })

  it('Escape в інпуті закриває список', async () => {
    results.value = [KYIV]
    const { wrapper, input } = await typed()
    await input.trigger('keydown', { key: 'Escape' })
    expect(clear).toHaveBeenCalled()
    expect(wrapper.find('[role="listbox"]').exists()).toBe(false)
  })

  it('Enter у стані помилки викликає retry', async () => {
    error.value = true
    const { input } = await typed()
    await input.trigger('keydown', { key: 'Enter' })
    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('оновлення результатів без вводу скидає підсвічування', async () => {
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
