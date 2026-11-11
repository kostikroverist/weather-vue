import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import BaseModal from '../BaseModal.vue'

let wrapper: VueWrapper | null = null

function mountModal(open = true) {
  wrapper = mount(BaseModal, {
    props: { open, title: 'Заголовок' },
    slots: { default: '<p data-testid="inner">Вміст</p>' },
    attachTo: document.body,
  })
  return wrapper
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
})

describe('BaseModal', () => {
  it('рендерить діалог із заголовком у body', () => {
    mountModal()
    const dialog = document.body.querySelector('[role=dialog]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Заголовок')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('не рендерить діалог, коли закрита', () => {
    mountModal(false)
    expect(document.body.querySelector('[role=dialog]')).toBeNull()
  })

  it('Escape емітить update:open з false', async () => {
    const w = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('клік по підкладці емітить update:open з false', async () => {
    const w = mountModal()
    const backdrop = document.body.querySelector<HTMLElement>('[data-testid="modal-backdrop"]')
    backdrop?.click()
    await w.vm.$nextTick()
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('клік всередині діалогу нічого не емітить', async () => {
    const w = mountModal()
    document.body.querySelector<HTMLElement>('[data-testid="inner"]')?.click()
    document.body.querySelector<HTMLElement>('[role=dialog]')?.click()
    await w.vm.$nextTick()
    expect(w.emitted('update:open')).toBeUndefined()
  })
})
