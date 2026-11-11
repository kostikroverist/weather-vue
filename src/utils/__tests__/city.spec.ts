import { afterEach, describe, expect, it } from 'vitest'
import { locale } from '@/i18n'
import {
  KYIV,
  cityLabel,
  cityName,
  cityOptionLabel,
  isCity,
  matchesQuery,
  toCity,
} from '@/utils/city'

describe('city', () => {
  afterEach(() => {
    locale.value = 'uk'
  })

  it('toCity бере local_names і формує id з координат', () => {
    expect(
      toCity({
        name: 'Kyiv',
        local_names: { uk: 'Київ', en: 'Kyiv' },
        lat: 50.4501,
        lon: 30.5234,
        country: 'UA',
        state: 'Kyiv City',
      }),
    ).toEqual({
      id: '50.45,30.52',
      names: { uk: 'Київ', en: 'Kyiv' },
      country: 'UA',
      state: 'Kyiv City',
      lat: 50.4501,
      lon: 30.5234,
    })
  })

  it('toCity без local_names бере name', () => {
    expect(toCity({ name: 'Lviv', lat: 49.8419, lon: 24.0315, country: 'UA' }).names).toEqual({
      uk: 'Lviv',
      en: 'Lviv',
    })
  })

  it('toCity округлює координати в id до 2 знаків', () => {
    expect(toCity({ name: 'A', lat: 50.4549, lon: 30.5151, country: 'UA' }).id).toBe('50.45,30.52')
  })

  it('cityLabel показує тільки назву і країну', () => {
    expect(cityLabel(KYIV)).toBe('Київ, UA')
    expect(cityLabel({ ...KYIV, state: 'Kyiv Oblast' })).toBe('Київ, UA')
  })

  it('cityOptionLabel показує область, тільки якщо вона відрізняється від назви', () => {
    expect(cityOptionLabel(KYIV)).toBe('Київ, UA')
    expect(cityOptionLabel({ ...KYIV, state: 'Київська область' })).toBe(
      'Київ, Київська область, UA',
    )
    expect(cityOptionLabel({ ...KYIV, state: 'Київ' })).toBe('Київ, UA')
  })

  it('cityName і cityLabel беруть назву поточної мови', () => {
    expect(cityName(KYIV)).toBe('Київ')
    locale.value = 'en'
    expect(cityName(KYIV)).toBe('Kyiv')
    expect(cityLabel(KYIV)).toBe('Kyiv, UA')
    expect(cityLabel({ ...KYIV, state: 'Kyiv' })).toBe('Kyiv, UA')
    expect(cityOptionLabel({ ...KYIV, state: 'Kyiv Oblast' })).toBe('Kyiv, Kyiv Oblast, UA')
  })

  it('isCity відкидає неповні обʼєкти', () => {
    expect(isCity({ id: 'x' })).toBe(false)
    expect(isCity(KYIV)).toBe(true)
  })

  it('matchesQuery перевіряє початок назви будь-якою мовою без регістру', () => {
    const lviv = { ...KYIV, names: { uk: 'Львів', en: 'Lviv' } }
    const taikkyi = { ...KYIV, names: { uk: 'Taikkyi', en: 'Taikkyi' } }
    expect(matchesQuery(lviv, 'Льв')).toBe(true)
    expect(matchesQuery(lviv, 'львів')).toBe(true)
    expect(matchesQuery(KYIV, 'Kyi')).toBe(true)
    expect(matchesQuery(KYIV, '  kyi ')).toBe(true)
    expect(matchesQuery(taikkyi, 'Kyi')).toBe(false)
  })
})
