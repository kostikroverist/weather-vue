import { expect, test } from '@playwright/test'
import { mockApi } from './support/mockApi.js'

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('перемикання мови на англійську зберігається після перезавантаження', async ({ page }) => {
  await page.goto('/')
  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: 'Головна' })).toBeVisible()
  await expect(page.getByTestId('city-input')).toHaveValue('Київ, UA')

  const englishWeather = page.waitForRequest(
    (request) =>
      request.url().includes('/data/2.5/weather') &&
      new URL(request.url()).searchParams.get('lang') === 'en',
  )
  await page.getByTestId('locale-en').click()
  await englishWeather

  await expect(page.getByTestId('locale-en')).toHaveAttribute('aria-pressed', 'true')
  await expect(header.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByTestId('tab-favorites')).toHaveText(/Favorites/)
  await expect(page.getByTestId('city-input')).toHaveValue('Kyiv, UA')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.reload()
  await expect(page.getByTestId('locale-en')).toHaveAttribute('aria-pressed', 'true')
  await expect(header.getByRole('link', { name: 'Home' })).toBeVisible()
  await expect(page.getByTestId('tab-favorites')).toHaveText(/Favorites/)
  await expect(page.getByTestId('city-input')).toHaveValue('Kyiv, UA')

  await page.getByTestId('locale-uk').click()
  await expect(header.getByRole('link', { name: 'Головна' })).toBeVisible()
  await expect(page.getByTestId('city-input')).toHaveValue('Київ, UA')
})
