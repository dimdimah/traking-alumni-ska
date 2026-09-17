import type { Profile } from '@/types/database'

const PROFILE_CACHE_KEY = 'unikom_profile_cache'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 menit

export function getCachedProfile(): Profile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw) as { data: Profile; ts: number }
    if (Date.now() - ts > CACHE_TTL_MS) {
      sessionStorage.removeItem(PROFILE_CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

export function setCachedProfile(p: Profile) {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify({ data: p, ts: Date.now() }))
  } catch {}
}

export function clearCachedProfile() {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY)
  } catch {}
}