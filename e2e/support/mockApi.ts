import type { Page } from '@playwright/test'
import geo from '../fixtures/geo.json' with { type: 'json' }
import weather from '../fixtures/weather.json' with { type: 'json' }
import forecast from '../fixtures/forecast.json' with { type: 'json' }

const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export async function mockApi(page: Page): Promise<void> {
  await page.route('**/geo/1.0/direct**', async (route) => {
    const q = (new URL(route.request().url()).searchParams.get('q') ?? '').toLowerCase()
    const found = geo.filter((city) => city.local_names.uk.toLowerCase().startsWith(q))
    await route.fulfill({ json: found })
  })
  await page.route('**/data/2.5/weather**', (route) => route.fulfill({ json: weather }))
  await page.route('**/data/2.5/forecast**', (route) => route.fulfill({ json: forecast }))
  await page.route('**/openweathermap.org/img/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL_PNG }),
  )
}
