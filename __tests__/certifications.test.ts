import { describe, it, expect } from '@jest/globals'
import {
  normalizeCertifications,
  parseCertifications,
  formatCertifications,
  getCertificationNames,
} from '@/lib/utils/certifications'

describe('normalizeCertifications', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(normalizeCertifications(null)).toBe('')
    expect(normalizeCertifications(undefined)).toBe('')
    expect(normalizeCertifications('')).toBe('')
    expect(normalizeCertifications([])).toBe('')
  })

  it('joins array entries with newline separator', () => {
    expect(normalizeCertifications(['AWS|Amazon|2024', 'Google'])).toBe('AWS|Amazon|2024\nGoogle')
  })

  it('passes through string values', () => {
    expect(normalizeCertifications('AWS|Amazon|2024')).toBe('AWS|Amazon|2024')
  })
})

describe('parseCertifications', () => {
  it('parses structured entries (name|issuer|year)', () => {
    const value = 'AWS Certified Cloud Practitioner|Amazon Web Services|2024\nGoogle UX Design|Google|2023'
    expect(parseCertifications(value)).toEqual([
      { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' },
      { name: 'Google UX Design', issuer: 'Google', year: '2023' },
    ])
  })

  it('parses partial entries (name|issuer, name|y ear-free)', () => {
    expect(parseCertifications('MikroTik MTCNA|MikroTik')).toEqual([
      { name: 'MikroTik MTCNA', issuer: 'MikroTik', year: undefined },
    ])
    expect(parseCertifications('MTCNA| |2022')).toEqual([{ name: 'MTCNA', year: '2022' }])
  })

  it('parses legacy comma/semicolon separated plain names', () => {
    expect(parseCertifications('AWS, Google Cloud, Azure; Laravel Developer')).toEqual([
      { name: 'AWS' },
      { name: 'Google Cloud' },
      { name: 'Azure' },
      { name: 'Laravel Developer' },
    ])
  })

  it('parses array input (DB jsonb)', () => {
    expect(parseCertifications(['AWS|Amazon|2024', 'Google'])).toEqual([
      { name: 'AWS', issuer: 'Amazon', year: '2024' },
      { name: 'Google' },
    ])
  })

  it('ignores blank lines', () => {
    expect(parseCertifications('AWS|Amazon|2024\n\nGoogle')).toHaveLength(2)
  })
})

describe('formatCertifications', () => {
  it('round-trips structured entries', () => {
    const entries = [
      { name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' },
      { name: 'Google UX Design', issuer: 'Google', year: '2023' },
    ]
    expect(formatCertifications(entries)).toBe(
      'AWS Certified Cloud Practitioner|Amazon Web Services|2024\nGoogle UX Design|Google|2023',
    )
  })

  it('omits trailing separators for missing optional fields', () => {
    expect(formatCertifications([{ name: 'MTCNA', issuer: 'MikroTik' }])).toBe('MTCNA|MikroTik')
    expect(formatCertifications([{ name: 'AWS' }])).toBe('AWS')
  })
})

describe('getCertificationNames', () => {
  it('extracts only names (metadata excluded) for matching', () => {
    expect(getCertificationNames('AWS|Amazon|2024\nGoogle|Google Inc|2023')).toEqual(['AWS', 'Google'])
  })

  it('deduplicates names case-insensitively', () => {
    expect(getCertificationNames(['AWS|Amazon|2024', 'aws|Amazon', 'Google'])).toEqual(['AWS', 'Google'])
  })

  it('handles legacy plain arrays', () => {
    expect(getCertificationNames(['Laravel Developer', 'React'])).toEqual(['Laravel Developer', 'React'])
  })
})