import { expect, test } from '@playwright/test'
import { mockApi, mockIp } from './support/mockApi.js'

const LVIV = { lat: 49.8397, lon: 24.0297 }

test('the IP city is put into the first block', async ({ page }) => {
  await mockApi(page)
  await mockIp(page, LVIV)
  await page.goto('/')
  await expect(page.getByTestId('city-input')).toHaveValue(/^Львів, /)
})

test('after a reload the IP city does not flash Kyiv', async ({ page }) => {
  await mockApi(page)
  await mockIp(page, LVIV)
  await page.goto('/')
  await expect(page.getByTestId('city-input')).toHaveValue(/^Львів, /)
  await page.getByTestId('fav-button').click()
  await expect(page.getByTestId('fav-button')).toHaveText('★ В обраному')

  const seen: string[] = []
  await page.exposeFunction('reportState', (value: string) => seen.push(value))
  await page.addInitScript({
    content: `new MutationObserver(() => {
      const input = document.querySelector('[data-testid="city-input"]')
      const button = document.querySelector('[data-testid="fav-button"]')
      if (input) window.reportState('input:' + input.value)
      if (button && button.textContent) window.reportState('fav:' + button.textContent.trim())
    }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true })`,
  })
  await page.reload()
  await expect(page.getByTestId('fav-button')).toHaveText('★ В обраному')
  expect(seen).not.toContain('fav:☆ В обране')
  expect(seen.filter((s) => s.startsWith('input:Київ'))).toEqual([])
})
