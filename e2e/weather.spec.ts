import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import geo from './fixtures/geo.json' with { type: 'json' }
import weather from './fixtures/weather.json' with { type: 'json' }
import { mockApi } from './support/mockApi.js'

const FAVORITES_KEY = 'weather:favorites'
const FULL_FAVORITES = ['Львів', 'Одеса', 'Харків', 'Варшава', 'Токіо']

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

function scrollWidth(page: Page): Promise<number> {
  return page.evaluate<number>('document.documentElement.scrollWidth')
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
  await expect(page.getByTestId('updated-at')).toHaveText(/^Оновлено \d{2}:\d{2}$/)
  const reload = page.waitForRequest('**/data/2.5/weather**')
  await page.getByTestId('refresh').click()
  await reload
})

test('2. пошук міста з вибором клавіатурою', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await input.click()
  await input.fill('Львів')
  await expect(page.getByTestId('city-option').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await expect(input).toHaveValue(/Львів/)
})

test('2a. пошук за англійською назвою показує місто мовою інтерфейсу', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await input.click()
  await input.fill('Kyiv')
  await expect(page.getByTestId('city-option')).toHaveCount(1)
  await expect(page.getByTestId('city-option')).toHaveText('Київ, Kyiv City, UA')
})

test('2b. неповна назва дає «Місто не знайдено»', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await input.click()
  await input.fill('Ки')
  await expect(page.getByText('Місто не знайдено')).toBeVisible()
  await expect(page.getByTestId('city-option')).toHaveCount(0)
})

test('2c. клієнтський фільтр відкидає міста, назва яких не починається з запиту', async ({
  page,
}) => {
  await page.route('**/geo/1.0/direct**', (route) =>
    route.fulfill({
      json: [
        {
          name: 'Kyiv City',
          local_names: { uk: 'Місто Київ', en: 'Kyiv City' },
          lat: 50.45,
          lon: 30.52,
          country: 'UA',
        },
      ],
    }),
  )
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await input.click()
  await input.fill('Ки')
  await expect(page.getByText('Місто не знайдено')).toBeVisible()
  await expect(page.getByTestId('city-option')).toHaveCount(0)
})

test('3. максимум 5 блоків', async ({ page }) => {
  await page.goto('/')
  const add = page.getByTestId('add-block')
  for (let i = 0; i < 4; i++) {
    await add.click()
    await expect(page.getByTestId('weather-block').nth(i + 1).getByTestId('city-input')).toBeFocused()
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
  await expect(page.getByTestId('add-block')).toBeFocused()
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
  await seedFavorites(page, FULL_FAVORITES)
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

test('6a. ліміт обраного: «Скасувати» і Esc закривають без змін', async ({ page }) => {
  await seedFavorites(page, FULL_FAVORITES)
  await page.goto('/')
  const fav = page.getByTestId('fav-button')
  const modal = page.getByTestId('limit-modal')
  const stored = () => page.evaluate((key) => localStorage.getItem(key), FAVORITES_KEY)
  const before = await stored()

  await fav.click()
  await expect(modal).toBeVisible()
  await modal.getByRole('button', { name: 'Скасувати' }).click()
  await expect(modal).toBeHidden()
  await expect(fav).toHaveText('☆ В обране')
  await expect(page.getByTestId('favorites-badge')).toHaveText('5')
  expect(await stored()).toBe(before)

  await fav.click()
  await expect(modal).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
  await expect(fav).toHaveText('☆ В обране')
  await expect(page.getByTestId('favorites-badge')).toHaveText('5')
  expect(await stored()).toBe(before)
})

test('7. режим «5 днів»: огляд, погодинна деталізація дня і повернення', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('mode-days').click()
  const tiles = page.getByTestId('day-tile')
  const cells = page.getByTestId('strip-cell')
  const title = page.getByTestId('day-hourly-title')
  const back = page.getByTestId('days-back')

  await expect(tiles).toHaveCount(5)
  await expect(cells).toHaveCount(5)
  await expect(page.getByTestId('days-note')).toBeVisible()
  await expect(tiles.first()).toHaveAttribute('aria-current', 'date')
  await expect(tiles.first()).toHaveClass(/day--today/)
  await expect(page.locator('[data-testid="day-tile"][aria-current="date"]')).toHaveCount(1)
  for (const tile of await tiles.all()) {
    await expect(tile).toHaveAttribute('aria-pressed', 'false')
  }
  await expect(title).toHaveCount(0)
  await expect(back).toHaveCount(0)

  await tiles.first().click()
  await expect(tiles.first()).toHaveAttribute('aria-pressed', 'true')
  await expect(title).toContainText('По годинах')
  await expect(cells).toHaveCount(4)

  await tiles.nth(1).click()
  await expect(tiles.nth(1)).toHaveAttribute('aria-pressed', 'true')
  await expect(tiles.first()).toHaveAttribute('aria-pressed', 'false')
  await expect(title).toContainText('По годинах')
  await expect(cells).toHaveCount(8)
  await expect(page.getByTestId('precip-summary')).toBeVisible()

  await back.click()
  await expect(title).toHaveCount(0)
  await expect(back).toHaveCount(0)
  await expect(cells).toHaveCount(5)
  await expect(tiles.nth(1)).toHaveAttribute('aria-pressed', 'false')
})

test('9. блоки головної зберігаються після перезавантаження', async ({ page }) => {
  await page.goto('/')
  const input = page.getByTestId('city-input')
  await expect(input).toHaveValue('Київ, UA')
  await input.click()
  await input.fill('Львів')
  await expect(page.getByTestId('city-option').first()).toBeVisible()
  await input.press('ArrowDown')
  await input.press('Enter')
  await page.getByTestId('add-block').click()
  await expect(page.getByTestId('weather-block')).toHaveCount(2)

  await page.reload()
  await expect(page.getByTestId('weather-block')).toHaveCount(2)
  await expect(page.getByTestId('city-input').first()).toHaveValue(/^Львів/)
})

test('10. зміна міста: до відповіді показується скелетон, а не дані попереднього', async ({
  page,
}) => {
  await page.goto('/')
  const block = page.getByTestId('weather-block')
  await expect(block.getByTestId('temp-chart')).toBeVisible()

  let release = () => {}
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/data/2.5/weather**', async (route) => {
    await gate
    await route.fulfill({ json: weather })
  })

  const input = page.getByTestId('city-input')
  try {
    await input.click()
    await input.fill('Львів')
    await page.getByTestId('city-option').first().click()
    await expect(input).toHaveValue('Львів, UA')
    await expect(block.getByTestId('block-skeleton')).toBeVisible()
    await expect(block.getByTestId('temp-chart')).toHaveCount(0)
    await expect(block.getByTestId('strip-cell')).toHaveCount(0)
  } finally {
    release()
  }
  await expect(block.getByTestId('block-skeleton')).toHaveCount(0)
  await expect(block.getByTestId('temp-chart')).toBeVisible()
  await expect(block).toContainText('Львів')
})

test('8. немає горизонтального скролу на головній, у «5 днях» і в модалці @mobile', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  expect(await scrollWidth(page)).toBeLessThanOrEqual(360)

  await page.getByTestId('mode-days').click()
  await expect(page.getByTestId('day-tile')).toHaveCount(5)
  await expect(page.getByTestId('strip-cell')).toHaveCount(5)
  expect(await scrollWidth(page)).toBeLessThanOrEqual(360)

  await page.getByTestId('day-tile').nth(1).click()
  await expect(page.getByTestId('strip-cell')).toHaveCount(8)
  expect(await scrollWidth(page)).toBeLessThanOrEqual(360)

  await page.getByTestId('add-block').click()
  await page.getByTestId('block-remove').first().click()
  await expect(page.getByTestId('confirm-modal')).toBeVisible()
  expect(await scrollWidth(page)).toBeLessThanOrEqual(360)
})

test('8a. немає горизонтального скролу з модалкою ліміту обраного @mobile', async ({ page }) => {
  await seedFavorites(page, FULL_FAVORITES)
  await page.goto('/')
  await expect(page.getByTestId('temp-chart')).toBeVisible()
  await page.getByTestId('fav-button').click()
  await expect(page.getByTestId('limit-modal')).toBeVisible()
  expect(await scrollWidth(page)).toBeLessThanOrEqual(360)
})
