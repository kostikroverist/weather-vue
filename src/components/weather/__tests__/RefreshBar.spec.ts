import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RefreshBar from '@/components/weather/RefreshBar.vue'

describe('RefreshBar', () => {
  it('під час loading клік не емітить refresh, кнопка має aria-disabled без disabled', async () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: true } })
    const button = wrapper.find('[data-testid="refresh"]')
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.attributes('disabled')).toBeUndefined()
    await button.trigger('click')
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })

  it('без loading клік емітить refresh', async () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: false } })
    await wrapper.find('[data-testid="refresh"]').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('при updatedAt = null рядка часу немає', () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: null, loading: false } })
    expect(wrapper.find('[data-testid="updated-at"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="refresh"]').exists()).toBe(true)
  })

  it('при updatedAt показує «Оновлено …»', () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: false } })
    expect(wrapper.find('[data-testid="updated-at"]').text()).toMatch(/^Оновлено \d{2}:\d{2}$/)
  })
})
