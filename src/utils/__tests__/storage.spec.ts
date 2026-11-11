import { beforeEach, describe, expect, it } from 'vitest'
import { readJson, writeJson } from '@/utils/storage'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('returns the fallback for corrupted JSON', () => {
    localStorage.setItem('k', '{broken')
    expect(readJson('k', Array.isArray, [])).toEqual([])
  })

  it('returns the fallback for an invalid value', () => {
    localStorage.setItem('k', '{"a":1}')
    expect(readJson('k', Array.isArray, [])).toEqual([])
  })

  it('reads what writeJson wrote', () => {
    writeJson('k', [1])
    expect(readJson('k', Array.isArray, [])).toEqual([1])
  })
})
