import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RefreshBar from '@/components/weather/RefreshBar.vue'

describe('RefreshBar', () => {
  it('while loading a click does not emit refresh, the button has aria-disabled without disabled', async () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: true } })
    const button = wrapper.find('[data-testid="refresh"]')
    expect(button.attributes('aria-disabled')).toBe('true')
    expect(button.attributes('disabled')).toBeUndefined()
    await button.trigger('click')
    expect(wrapper.emitted('refresh')).toBeUndefined()
  })

  it('without loading a click emits refresh', async () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: false } })
    await wrapper.find('[data-testid="refresh"]').trigger('click')
    expect(wrapper.emitted('refresh')).toHaveLength(1)
  })

  it('there is no time line when updatedAt = null', () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: null, loading: false } })
    expect(wrapper.find('[data-testid="updated-at"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="refresh"]').exists()).toBe(true)
  })

  it('shows the "Updated …" line when updatedAt is set', () => {
    const wrapper = mount(RefreshBar, { props: { updatedAt: 1700000000000, loading: false } })
    expect(wrapper.find('[data-testid="updated-at"]').text()).toMatch(/^Оновлено \d{2}:\d{2}$/)
  })
})
