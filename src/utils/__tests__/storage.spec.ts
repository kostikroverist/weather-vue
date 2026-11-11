import { beforeEach, describe, expect, it } from 'vitest'
import { readJson, writeJson } from '@/utils/storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('повертає fallback для пошкодженого JSON', () => {
    localStorage.setItem('k', '{broken')
    expect(readJson('k', Array.isArray, [])).toEqual([])
  })

  it('повертає fallback для невалідного значення', () => {
    localStorage.setItem('k', '{"a":1}')
    expect(readJson('k', Array.isArray, [])).toEqual([])
  })

  it('читає те, що записав writeJson', () => {
    writeJson('k', [1])
    expect(readJson('k', Array.isArray, [])).toEqual([1])
  })
})
