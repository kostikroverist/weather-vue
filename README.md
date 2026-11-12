# Pogodnyk — Weather App

A weather app built with Vue 3, TypeScript, Vite, Pinia and Chart.js. It uses no CSS frameworks and no UI libraries. Data comes from [OpenWeather](https://openweathermap.org/): current weather, a 5-day / 3-hour forecast and city geocoding.

## Quick start

```sh
npm install
```

Create `.env.local` in the project root:

```
VITE_OWM_KEY=your_openweather_api_key
```

```sh
npm run dev
```

## Features

- **City search with autocomplete**: 300 ms debounce, starts at 2 characters, cancels stale requests, up to 5 suggestions, keyboard navigation.
- **Current weather card**: temperature, description, feels like, humidity, wind, pressure, next sunrise or sunset.
- **Temperature chart** (Chart.js) with precipitation bars and an hourly strip.
- **Day / 5 days mode**: daily tiles with average, min and max temperature, and hourly details for each day.
- **Up to 5 weather blocks** on the home page, saved to localStorage. Deleting a block asks for confirmation.
- **Favorites**: up to 5 cities. When the list is full, a modal lets you replace one.
- **Location by IP**: detects the user's city on the first visit.
- **Precipitation summary** for the next 24 hours.
- **Skeleton loaders** while weather and search results load.
- **i18n**: the UI and API responses come in Ukrainian or English.
- **Day / Night theme**: set manually, or Auto, which follows sunrise and sunset in the first block's city.
- **Responsive layout**: 360px to 1200px.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run oxlint and ESLint (with `--fix`) |
| `npm run type-check` | Run vue-tsc |
| `npm run test:unit` | Run unit tests with Vitest and @vue/test-utils |
| `npm run test:e2e` | Run e2e tests with Playwright |

Before the first e2e run, install the browser:

```sh
npx playwright install chromium
```

E2E tests run in a desktop profile (1280×800) and a mobile profile (360×740). Calls to OpenWeather and the IP service are mocked with fixtures from `e2e/fixtures`, so the tests need no network and no API key.

## Deploy

The app deploys to Vercel. Set the `VITE_OWM_KEY` environment variable in the project settings. `vercel.json` rewrites every path to `index.html`, so router history mode works on direct links and page reloads.

## Limitations

- The free OpenWeather plan has no hourly forecast. The "today" chart shows the next 24 hours as 8 points, 3 hours apart.
- Times use the city's local time from the API `timezone` offset. DST changes within the 5-day range are not handled.
- The OpenWeather geocoder matches full city names, so suggestions appear once the name is typed in full.
- The API key ships in the client bundle, because the app has no backend.
