import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import BaseSegmented from '@/components/ui/BaseSegmented.vue'
import CurrentCard from '@/components/weather/CurrentCard.vue'
import TempChart from '@/components/weather/TempChart.vue'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import { useThemeStore } from '@/stores/theme'
import type { City } from '@/types/city'
import type { CurrentView, DayPoint, HourPoint } from '@/types/forecast'
import { KYIV } from '@/utils/city'

const LVIV: City = {
  id: '49.84,24.03',
  names: { uk: 'Львів', en: 'Lviv' },
  country: 'UA',
  lat: 49.8419,
  lon: 24.0315,
}

const current: CurrentView = {
  temp: 6,
  feelsLike: 3,
  description: 'хмарно',
  icon: '04d',
  humidity: 81,
  windSpeed: 4,
  pressure: 1016,
  sunEvent: { kind: 'sunset', time: '16:19' },
  isDay: true,
}

const weatherState = vi.hoisted(() => ({
  todayKey: '2026-11-10',
  isDay: true,
  updatedAt: 1700000000000,
  reload: vi.fn<() => void>(),
}))

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
    current: ref({ ...current, isDay: weatherState.isDay }),
    hours: ref(hours),
    days: ref(days),
    todayKey: ref(weatherState.todayKey),
    precipitation: ref(null),
    loading: ref(false),
    error: ref(false),
    updatedAt: ref(weatherState.updatedAt),
    reload: weatherState.reload,
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
    weatherState.todayKey = '2026-11-10'
    weatherState.isDay = true
    weatherState.reload.mockClear()
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

  it('режим «День» передає графіку 8 погодинних точок', () => {
    const chart = mountBlock({}).findComponent(TempChart)
    expect(chart.props('labels')).toEqual(hours.map((h) => h.time))
    expect(chart.props('temps')).toEqual(hours.map((h) => h.temp))
  })

  it('режим «5 днів» показує огляд: 5 плиток, сьогодні в рамці, графік і смуга по днях', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    const tiles = wrapper.findAll('[data-testid="day-tile"]')
    expect(tiles).toHaveLength(5)
    expect(tiles[0]!.classes()).toContain('day--today')
    expect(tiles[1]!.classes()).not.toContain('day--today')
    expect(tiles[0]!.attributes('aria-current')).toBe('date')
    expect(tiles.map((tile) => tile.attributes('aria-pressed'))).toEqual(Array(5).fill('false'))
    expect(wrapper.find('[data-testid="days-note"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="precip-summary"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="day-hourly-title"]').exists()).toBe(false)
    const chart = wrapper.findComponent(TempChart)
    expect(chart.props('labels')).toEqual(['Нд 10', 'Пн 11', 'Вт 12', 'Ср 13', 'Чт 14'])
    expect(chart.props('temps')).toEqual([0, 1, 2, 3, 4])
    expect(chart.props('precipitation')).toEqual([0, 1.2, 0, 0, 0])
    const cells = wrapper.findAll('[data-testid="strip-cell"]')
    expect(cells).toHaveLength(5)
    expect(cells[1]!.text()).toContain('Пн')
  })

  it('рамка «сьогодні» стоїть на плитці з датою todayKey і має aria-current', async () => {
    weatherState.todayKey = '2026-11-11'
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    const tiles = wrapper.findAll('[data-testid="day-tile"]')
    expect(tiles.map((tile) => tile.classes().includes('day--today'))).toEqual([
      false,
      true,
      false,
      false,
      false,
    ])
    expect(tiles[1]!.attributes('aria-current')).toBe('date')
    expect(tiles[0]!.attributes('aria-current')).toBeUndefined()
  })

  it('без сьогоднішньої дати в прогнозі рамки «сьогодні» немає', async () => {
    weatherState.todayKey = '2026-11-09'
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    expect(wrapper.findAll('.day--today')).toHaveLength(0)
    expect(wrapper.findAll('[aria-current="date"]')).toHaveLength(0)
  })

  it('основний блок передає темі isDay поточної погоди', () => {
    weatherState.isDay = false
    mountBlock({ primary: true })
    expect(useThemeStore().daylight).toBe(false)
  })

  it('клік по плитці відкриває погоду дня по годинах, «Назад» повертає огляд', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    await wrapper.findAll('[data-testid="day-tile"]')[1]!.trigger('click')
    const tiles = wrapper.findAll('[data-testid="day-tile"]')
    expect(tiles[0]!.attributes('aria-pressed')).toBe('false')
    expect(tiles[1]!.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(4)
    expect(wrapper.findComponent(TempChart).props('labels')).toEqual([
      '00:00',
      '03:00',
      '06:00',
      '09:00',
    ])
    expect(wrapper.find('[data-testid="day-hourly-title"]').text()).toBe('По годинах: Пн, 11 лист')
    expect(wrapper.find('[data-testid="precip-summary"]').text()).toBe(
      'Дощ з 06:00 до 09:00, найсильніший о 06:00: 1,2 мм',
    )
    const back = wrapper.get('[data-testid="days-back"]')
    expect(back.text()).toBe('Назад до 5 днів')
    await back.trigger('click')
    expect(wrapper.findComponent(TempChart).props('labels')).toHaveLength(5)
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(5)
    expect(wrapper.find('[data-testid="days-back"]').exists()).toBe(false)
  })

  it('повторний клік по вибраній плитці повертає огляд', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    await wrapper.findAll('[data-testid="day-tile"]')[2]!.trigger('click')
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(5)
    await wrapper.findAll('[data-testid="day-tile"]')[2]!.trigger('click')
    expect(wrapper.findAll('[data-testid="day-tile"]')[2]!.attributes('aria-pressed')).toBe('false')
    expect(wrapper.findComponent(TempChart).props('labels')).toHaveLength(5)
  })

  it('перемикання режиму скидає вибраний день', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    await wrapper.findAll('[data-testid="day-tile"]')[1]!.trigger('click')
    await wrapper.find('[data-testid="mode-day"]').trigger('click')
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    expect(wrapper.find('[data-testid="day-hourly-title"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(5)
  })

  it('зміна міста скидає вибраний день', async () => {
    const wrapper = mountBlock({})
    await wrapper.find('[data-testid="mode-days"]').trigger('click')
    await wrapper.findAll('[data-testid="day-tile"]')[1]!.trigger('click')
    await wrapper.setProps({ city: LVIV })
    expect(wrapper.find('[data-testid="day-hourly-title"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="strip-cell"]')).toHaveLength(5)
  })

  it('картка без події сонця (полярний день/ніч) показує 3 показники', () => {
    const card = mount(CurrentCard, { props: { current: { ...current, sunEvent: null } } })
    const labels = card.findAll('dt').map((dt) => dt.text())
    expect(labels).toEqual(['Вологість', 'Вітер', 'Тиск'])
  })

  it('перемикач режиму має aria-label', () => {
    const wrapper = mountBlock({})
    expect(wrapper.findComponent(BaseSegmented).attributes('aria-label')).toBe('Режим відображення')
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

  it('focusSearch() фокусує інпут пошуку', () => {
    const wrapper = mount(WeatherBlock, {
      props: { city: KYIV },
      global: { stubs: { TempChart: true } },
      attachTo: document.body,
    })
    wrapper.vm.focusSearch()
    expect(document.activeElement).toBe(wrapper.find('[data-testid="city-input"]').element)
    wrapper.unmount()
  })

  it('показує «Оновлено» і кнопка оновлення викликає reload', async () => {
    const wrapper = mountBlock({})
    expect(wrapper.find('[data-testid="updated-at"]').text()).toMatch(/^Оновлено \d{2}:\d{2}$/)
    await wrapper.find('[data-testid="refresh"]').trigger('click')
    expect(weatherState.reload).toHaveBeenCalledTimes(1)
  })
})
