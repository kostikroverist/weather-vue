import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
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
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

function addTrigger(): HTMLButtonElement {
  const trigger = document.createElement('button')
  trigger.textContent = 'trigger'
  document.body.appendChild(trigger)
  trigger.focus()
  return trigger
}

function pressTab(shiftKey = false): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true, cancelable: true })
  ;(document.activeElement ?? document.body).dispatchEvent(event)
  return event
}

describe('BaseModal', () => {
  it('renders the dialog with a title in body', () => {
    mountModal()
    const dialog = document.body.querySelector('[role=dialog]')
    expect(dialog).not.toBeNull()
    expect(dialog?.textContent).toContain('Заголовок')
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })

  it('does not render the dialog when closed', () => {
    mountModal(false)
    expect(document.body.querySelector('[role=dialog]')).toBeNull()
  })

  it('Escape emits update:open with false', async () => {
    const w = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('clicking the backdrop emits update:open with false', async () => {
    const w = mountModal()
    const backdrop = document.body.querySelector<HTMLElement>('[data-testid="modal-backdrop"]')
    backdrop?.click()
    await w.vm.$nextTick()
    expect(w.emitted('update:open')?.[0]).toEqual([false])
  })

  it('clicking inside the dialog emits nothing', async () => {
    const w = mountModal()
    document.body.querySelector<HTMLElement>('[data-testid="inner"]')?.click()
    document.body.querySelector<HTMLElement>('[role=dialog]')?.click()
    await w.vm.$nextTick()
    expect(w.emitted('update:open')).toBeUndefined()
  })

  it('moves focus to the dialog after opening', async () => {
    addTrigger()
    const w = mountModal(false)
    await w.setProps({ open: true })
    await flushPromises()
    expect(document.activeElement).toBe(document.body.querySelector('[role=dialog]'))
  })

  it('returns focus to the trigger after closing', async () => {
    const trigger = addTrigger()
    const w = mountModal(false)
    await w.setProps({ open: true })
    await flushPromises()
    await w.setProps({ open: false })
    await flushPromises()
    expect(document.activeElement).toBe(trigger)
  })

  it('Tab from the last element moves to the first, Shift+Tab from the first moves to the last', async () => {
    wrapper = mount(BaseModal, {
      props: { open: true, title: 'Заголовок' },
      slots: {
        default: '<button data-testid="first">1</button><input data-testid="middle" />',
        actions: '<button data-testid="last">2</button><button disabled>3</button>',
      },
      attachTo: document.body,
    })
    await flushPromises()
    const first = document.body.querySelector<HTMLElement>('[data-testid="first"]')
    const last = document.body.querySelector<HTMLElement>('[data-testid="last"]')
    last?.focus()
    expect(pressTab().defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(first)
    expect(pressTab(true).defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(last)
  })

  it('keeps focus on the dialog when there are no focusable elements', async () => {
    mountModal()
    await flushPromises()
    const dialog = document.body.querySelector('[role=dialog]')
    expect(pressTab().defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(dialog)
  })

  it('locks body scroll while open and restores the previous value', async () => {
    document.body.style.overflow = 'auto'
    const w = mountModal(false)
    await w.setProps({ open: true })
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    await w.setProps({ open: false })
    await flushPromises()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('restores body scroll when an open modal is unmounted', async () => {
    document.body.style.overflow = 'scroll'
    const w = mountModal()
    await flushPromises()
    expect(document.body.style.overflow).toBe('hidden')
    w.unmount()
    wrapper = null
    expect(document.body.style.overflow).toBe('scroll')
  })
})
