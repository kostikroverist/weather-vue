import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { apiLang, formatNumber, isLocale, locale, monthName, t, weekdayName } from '@/i18n'
import { en } from '@/i18n/en'
import { uk } from '@/i18n/uk'

describe('i18n', () => {
  afterEach(async () => {
    locale.value = 'uk'
    await nextTick()
    localStorage.clear()
  })

  it('interpolates params', () => {
    expect(t('blocks.count', { n: 2, max: 5 })).toBe('2 з 5 блоків')
    expect(t('fav.limit.text', { city: 'Одеса' })).toBe(
      'Щоб додати Одеса, видаліть одне місто: максимум 5.',
    )
  })

  it('maps the locale to the API language', () => {
    expect(apiLang()).toBe('ua')
    locale.value = 'en'
    expect(apiLang()).toBe('en')
  })

  it('has a non-empty en value for every uk key and no extra keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(uk).sort())
    for (const value of Object.values(en)) expect(value.trim()).not.toBe('')
  })

  it('translates by the current locale', () => {
    locale.value = 'en'
    expect(t('nav.home')).toBe('Home')
    expect(t('blocks.count', { n: 2, max: 5 })).toBe('2 of 5 blocks')
    expect(weekdayName(0)).toBe('Sun')
    expect(monthName(10)).toBe('Nov')
  })

  it('persists the locale and sets the document language', async () => {
    locale.value = 'en'
    await nextTick()
    expect(localStorage.getItem('weather:locale')).toBe('"en"')
    expect(document.documentElement.lang).toBe('en')
  })

  it('validates locale values', () => {
    expect(isLocale('uk')).toBe(true)
    expect(isLocale('en')).toBe(true)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })

  it('restores the saved locale and ignores invalid values', async () => {
    localStorage.setItem('weather:locale', '"en"')
    vi.resetModules()
    const restored = await import('@/i18n')
    expect(restored.locale.value).toBe('en')
    expect(document.documentElement.lang).toBe('en')

    localStorage.setItem('weather:locale', '"de"')
    vi.resetModules()
    const fallback = await import('@/i18n')
    expect(fallback.locale.value).toBe('uk')
  })

  it('formatNumber форматує число за поточною мовою', () => {
    expect(formatNumber(0.15, 2)).toBe('0,15')
    expect(formatNumber(2.44)).toBe('2,4')
    locale.value = 'en'
    expect(formatNumber(0.15, 2)).toBe('0.15')
    expect(t('chart.tooltipPrecip', { value: formatNumber(0.15, 2) })).toBe(
      'Precipitation: 0.15 mm',
    )
  })
})
