import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mockApi } from './support/mockApi.js'

async function recordThemes(page: Page, storage: Record<string, string>): Promise<string[]> {
  const seen: string[] = []
  await page.exposeFunction('reportTheme', (value: string) => seen.push(value))
  await page.addInitScript({
    content: `
      Object.entries(${JSON.stringify(storage)}).forEach(([key, value]) => localStorage.setItem(key, value))
      new MutationObserver(() => window.reportTheme((document.documentElement.dataset.theme || 'none') + (document.body ? ':after-body' : ':head')))
        .observe(document, { subtree: true, attributes: true, attributeFilter: ['data-theme'] })
    `,
  })
  return seen
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('темна тема не блимає світлою при завантаженні', async ({ page }) => {
  const seen = await recordThemes(page, { 'weather:theme': '"dark"' })
  await page.goto('/')
  await expect(page.getByTestId('weather-block')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  expect(seen[0]).toBe('dark:head')
  expect(seen.some((value) => value.startsWith('light'))).toBe(false)
})

test('«Авто» вночі стартує з темної теми без спалаху', async ({ page }) => {
  const seen = await recordThemes(page, {
    'weather:theme': '"auto"',
    'weather:daylight': 'false',
  })
  await page.goto('/')
  await expect(page.getByTestId('weather-block')).toBeVisible()
  expect(seen[0]).toBe('dark:head')
})
