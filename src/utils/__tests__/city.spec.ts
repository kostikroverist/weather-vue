import { describe, expect, it } from 'vitest'
import { KYIV, cityLabel, isCity, toCity } from '@/utils/city'

describe('city', () => {
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

  it('cityLabel показує область, тільки якщо вона відрізняється від назви', () => {
    expect(cityLabel(KYIV)).toBe('Київ, UA')
    expect(cityLabel({ ...KYIV, state: 'Київська область' })).toBe('Київ, Київська область, UA')
    expect(cityLabel({ ...KYIV, state: 'Київ' })).toBe('Київ, UA')
  })

  it('isCity відкидає неповні обʼєкти', () => {
    expect(isCity({ id: 'x' })).toBe(false)
    expect(isCity(KYIV)).toBe(true)
  })
})
