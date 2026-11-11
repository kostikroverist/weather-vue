import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import type { CurrentView, DayPoint, HourPoint } from '@/types/forecast'
import { KYIV } from '@/utils/city'

const current: CurrentView = {
  temp: 6,
  feelsLike: 3,
  description: 'хмарно',
  icon: '04d',
  humidity: 81,
  windSpeed: 4,
  pressure: 1016,
  sunEvent: { kind: 'sunset', time: '16:19' },
}

const hours: HourPoint[] = Array.from({ length: 8 }, (_, i) => ({
  dt: 1700000000 + i * 10800,
  time: `${String(i * 3).padStart(2, '0')}:00`,
  temp: i,
  icon: '04d',
  description: 'хмарно',
  pop: 0,
  rain: 0,
  snow: 0,
}))

const days: DayPoint[] = Array.from({ length: 5 }, (_, i) => ({
  dateKey: `2026-11-1${i}`,
  weekday: i,
  day: 10 + i,
  month: 10,
  avg: i,
  min: i - 2,
  max: i + 2,
  icon: '04d',
  pop: i === 1 ? 80 : 0,
  precipitation: i === 1 ? 1.2 : 0,
  hours: hours.slice(0, i + 3),
  summary:
    i === 1
      ? { kind: 'rain', ranges: [{ from: '06:00', to: '09:00' }], peak: { time: '06:00', mm: 1.2 } }
      : null,
}))

vi.mock('@/composables/useWeather', () => ({
  useWeather: () => ({
    current: ref(current),
    hours: ref(hours),
    days: ref(days),
    precipitation: ref(null),
    loading: ref(false),
    error: ref(false),
    reload: vi.fn<() => void>(),
  }),
}))

function mountBlock(props: Record<string, unknown>) {
  return mount(WeatherBlock, {
    props: { city: KYIV, ...props },
    global: { stubs: { TempChart: true } },
  })
}

describe('WeatherBlock', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('у режимі readonly показує назву замість пошуку і кнопку «Прибрати»', () => {
    const wrapper = mountBlock({ readonly: true, removable: true })
    expect(wrapper.find('[data-testid="city-input"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="block-remove"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Київ')
    expect(wrapper.find('[data-testid="fav-button"]').text()).toBe('★ Прибрати')
  })

  it('без removable немає кнопки видалення', () => {
    const wrapper = mountBlock({ removable: false })
    expect(wrapper.find('[data-testid="city-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="block-remove"]').exists()).toBe(false)
  })

  it('з removable показує кнопку видалення і емітить remove', async () => {
    const wrapper = mountBlock({ removable: true })
    await wrapper.find('[data-testid="block-remove"]').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
  })

  it('режим «День» показує 8 комірок смуги', () => {
    const wrapper = mountBlock({})
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(8)
    expect(wrapper.find('[data-testid="precip-summary"]').text()).toBe(
      'Без опадів найближчі 24 години',
    )
  })

  it('режим «5 днів» показує 5 плиток і погодинну смугу першого дня', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    const tiles = wrapper.findAll('[data-testid="day-tile"]')
    expect(tiles).toHaveLength(5)
    expect(tiles[0]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(3)
    expect(wrapper.find('[data-testid="precip-summary"]').text()).toBe('Без опадів цього дня')
  })

  it('вибір дня показує його погоду по годинах і опади', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    await wrapper.findAll('[data-testid="day-tile"]')[1]!.trigger('click')
    const tiles = wrapper.findAll('[data-testid="day-tile"]')
    expect(tiles[0]!.attributes('aria-pressed')).toBe('false')
    expect(tiles[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(4)
    expect(wrapper.find('[data-testid="day-hourly-title"]').text()).toBe('По годинах: Пн, 11 лист')
    expect(wrapper.find('[data-testid="precip-summary"]').text()).toBe(
      'Дощ з 06:00 до 09:00, найсильніший о 06:00: 1,2 мм',
    )
  })

  it('поки визначається місто, показує скелетон', () => {
    const wrapper = mountBlock({ city: null, locating: true })
    expect(wrapper.find('[data-testid="block-skeleton"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Знайдіть місто, щоб побачити погоду')
  })

  it('порожній блок показує тільки пошук і підказку', () => {
    const wrapper = mountBlock({ city: null })
    expect(wrapper.find('[data-testid="city-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="fav-button"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Знайдіть місто, щоб побачити погоду')
  })
})
