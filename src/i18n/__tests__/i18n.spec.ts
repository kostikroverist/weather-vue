import { describe, expect, it } from 'vitest'
import { apiLang, t } from '@/i18n'

describe('i18n', () => {
  it('interpolates params', () => {
    expect(t('blocks.count', { n: 2, max: 5 })).toBe('2 з 5 блоків')
    expect(t('fav.limit.text', { city: 'Одеса' })).toBe(
      'Щоб додати Одеса, видаліть одне місто: максимум 5.',
    )
  })

  it('maps the locale to the API language', () => {
    expect(apiLang()).toBe('ua')
  })
})
