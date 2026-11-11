import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import geo from './fixtures/geo.json' with { type: 'json' }
import { mockApi } from './support/mockApi.js'

const FAVORITES_KEY = 'weather:favorites'

function toStoredCity(name: string) {
  const found = geo.find((city) => city.local_names.uk === name)
  if (!found) throw new Error(`Unknown city ${name}`)
  return {
    id: `${found.lat.toFixed(2)},${found.lon.toFixed(2)}`,
    names: { uk: found.local_names.uk, en: found.local_names.en },
    country: found.country,
    lat: found.lat,
    lon: found.lon,
  }
}

async function seedFavorites(page: Page, names: string[]): Promise<void> {
  const cities = names.map(toStoredCity)
  await page.addInitScript(
    ([key, value]) => localStorage.setItem(key, value),
    [FAVORITES_KEY, JSON.stringify(cities)],
  )
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('1. початковий блок з Києвом, графіком, смугою і підсумком опадів', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('weather-block')).toHaveCount(1)
  await expect(page.getByTestId('city-input')).toHaveValue('Київ, UA')
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await expect(page.getByTestId('strip-cell')).toHaveCount(8)
  await expect(page.getByTestId('precip-summary')).toHaveText(/^\s*Дощ з/)
  await expect(page.getByTestId('block-remove')).toHaveCount(0)
})

test('2. пошук міста з вибором клавіатурою', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await input.click()
  await input.fill('Льв')
  await expect(page.getByTestId('city-option').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue(/Львів/)
})

test('3. максимум 5 блоків', async ({ page }) => {
  await page.goto('/')
  const add = page.getByTestId('add-block')
  for (let i = 0; i < 4; i++) {
    await add.click()
  }
  await expect(page.getByTestId('weather-block')).toHaveCount(5)
  await expect(add).toBeDisabled()
  await expect(page.getByText('Максимум 5 блоків')).toBeVisible()
})

test('4. видалення блоку з підтвердженням', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('add-block').click()
  const blocks = page.getByTestId('weather-block')
  await expect(blocks).toHaveCount(2)

  await blocks.nth(1).getByTestId('block-remove').click()
  const modal = page.getByTestId('confirm-modal')
  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: 'Скасувати' }).click()
  await expect(modal).toBeHidden()
  await expect(blocks).toHaveCount(2)

  await blocks.nth(1).getByTestId('block-remove').click()
  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: 'Видалити' }).click()
  await expect(modal).toBeHidden()
  await expect(blocks).toHaveCount(1)
  await expect(page.getByTestId('block-remove')).toHaveCount(0)
})

test('5. додавання в обране, вкладка «Вибране», перезавантаження, прибирання', async ({ page }) => {
  await page.goto('/')
  const fav = page.getByTestId('fav-button')
  await fav.click()
  await expect(fav).toHaveText('★ В обраному')
  await expect(page.getByTestId('weather-block')).toHaveAttribute('data-favorite', 'true')
  await expect(page.getByTestId('favorites-badge')).toHaveText('1')

  await page.getByTestId('tab-favorites').click()
  await expect(page.getByTestId('weather-block')).toHaveCount(1)
  await expect(page.getByTestId('city-input')).toHaveCount(0)
  await expect(page.getByTestId('fav-button')).toHaveText('★ Прибрати')

  await page.reload()
  await expect(page.getByTestId('weather-block')).toHaveCount(1)

  await page.getByTestId('fav-button').click()
  await expect(page.getByTestId('favorites-empty')).toBeVisible()
})

test('6. ліміт обраного: заміна міста через модалку', async ({ page }) => {
  await seedFavorites(page, ['Львів', 'Одеса', 'Харків', 'Варшава', 'Токіо'])
  await page.goto('/')
  await page.getByTestId('fav-button').click()

  const modal = page.getByTestId('limit-modal')
  await expect(modal).toContainText('Щоб додати Київ, видаліть одне місто: максимум 5.')
  await modal
    .getByRole('listitem')
    .filter({ hasText: 'Львів' })
    .getByRole('button', { name: 'Видалити' })
    .click()
  await expect(modal).toBeHidden()
  await expect(page.getByTestId('fav-button')).toHaveText('★ В обраному')
})

test('7. режим «5 днів»', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('mode-days').click()
  await expect(page.getByTestId('day-tile')).toHaveCount(5)
  await expect(page.getByTestId('strip-cell')).toHaveCount(5)
})

test('8. mobile: немає горизонтального скролу на головній і в модалці', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'тільки для профілю mobile')
  await page.goto('/')
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  const scrollWidth = () => page.evaluate<number>('document.documentElement.scrollWidth')
  expect(await scrollWidth()).toBeLessThanOrEqual(360)

  await page.getByTestId('add-block').click()
  await page.getByTestId('block-remove').first().click()
  await expect(page.getByTestId('confirm-modal')).toBeVisible()
  expect(await scrollWidth()).toBeLessThanOrEqual(360)
})
