import { describe, it, expect } from '@jest/globals'
import { canonicalLocationTokens } from '@/lib/location-normalize'

describe('Normalisasi Lokasi', () => {
  it('menyarukan label kawasan dengan kota di dalamnya', () => {
    expect(canonicalLocationTokens('Solo Raya')).toEqual(['solo'])
    expect(canonicalLocationTokens('Solo')).toEqual(['solo'])
    expect(canonicalLocationTokens('Surakarta')).toEqual(['solo'])
    expect(canonicalLocationTokens('Klaten')).toEqual(['solo'])
  })

  it('menyarukan varian penulisan Yogyakarta', () => {
    expect(canonicalLocationTokens('Kota Yogyakarta')).toEqual(['yogyakarta'])
    expect(canonicalLocationTokens('Yogyakarta')).toEqual(['yogyakarta'])
    expect(canonicalLocationTokens('DIY Yogyakarta')).toEqual(['yogyakarta'])
    expect(canonicalLocationTokens('Sleman')).toEqual(['yogyakarta'])
  })

  it('menyarukan kawasan Jakarta yang spesifik', () => {
    expect(canonicalLocationTokens('Jakarta Selatan')).toEqual(['jakarta'])
    expect(canonicalLocationTokens('DKI Jakarta')).toEqual(['jakarta'])
    expect(canonicalLocationTokens('Jabodetabek')).toEqual(['jakarta'])
  })

  it('menyarukan remote/wfh/hybrid menjadi satu', () => {
    expect(canonicalLocationTokens('Remote / WFH')).toEqual(['remote'])
    expect(canonicalLocationTokens('Hybrid')).toEqual(['remote'])
    expect(canonicalLocationTokens('Work From Home')).toEqual(['remote'])
  })

  it('seluruh indonesia tidak menghasilkan token pembatas lokasi', () => {
    expect(canonicalLocationTokens('Seluruh Indonesia')).toEqual([])
    expect(canonicalLocationTokens('seluruhindonesia')).toEqual([])
  })

  it('menangani lokasi multi kata dengan pemisah', () => {
    expect(canonicalLocationTokens('Surabaya, Jawa Timur')).toEqual([
      'surabaya',
      'jawa',
      'timur',
    ])
    expect(canonicalLocationTokens('Solo (Surakarta)')).toEqual(['solo'])
  })

  it('mengembalikan teks bebas apa adanya jika tidak ada alias', () => {
    expect(canonicalLocationTokens('Papua')).toEqual(['papua'])
    expect(canonicalLocationTokens('Lampung')).toEqual(['lampung'])
  })

  it('mengembalikan array kosong untuk lokasi kosong', () => {
    expect(canonicalLocationTokens(null)).toEqual([])
    expect(canonicalLocationTokens(undefined)).toEqual([])
    expect(canonicalLocationTokens('')).toEqual([])
  })
})