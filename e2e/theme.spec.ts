import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import weather from './fixtures/weather.json' with { type: 'json' }
import { mockApi } from './support/mockApi.js'

const FIXTURE_THEME =
  weather.dt >= weather.sys.sunrise && weather.dt < weather.sys.sunset ? 'light' : 'dark'

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
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-theme', FIXTURE_THEME)
  expect(await page.evaluate(() => localStorage.getItem('weather:daylight'))).toBe(
    String(FIXTURE_THEME === 'light'),
  )
})

test.describe('система з темною схемою', () => {
  test.use({ colorScheme: 'dark' })

  test('«Авто» без збереженого стану стартує з теми системи', async ({ page }) => {
    const seen = await recordThemes(page, {})
    await page.goto('/')
    await expect(page.getByTestId('weather-block')).toBeVisible()
    expect(seen[0]).toBe('dark:head')
    await expect(page.getByTestId('temp-chart')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', FIXTURE_THEME)
  })
})

test('ручний вибір теми змінює data-theme і зберігається після перезавантаження', async ({
  page,
}) => {
  const html = page.locator('html')
  await page.goto('/')
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await expect(html).toHaveAttribute('data-theme', FIXTURE_THEME)

  await page.getByTestId('theme-dark').click()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByTestId('theme-dark')).toHaveAttribute('aria-pressed', 'true')

  await page.getByTestId('theme-light').click()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await expect(page.getByTestId('theme-light')).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => localStorage.getItem('weather:theme'))).toBe('"light"')
})
