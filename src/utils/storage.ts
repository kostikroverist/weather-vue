export function readJson<T>(key: string, isValid: (v: unknown) => v is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    const value: unknown = JSON.parse(raw)
    return isValid(value) ? value : fallback
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    return
  }
}
