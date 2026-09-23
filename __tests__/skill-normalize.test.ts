import { describe, it, expect } from '@jest/globals'
import {
  canonicalSkillTokens,
  hasSkillOverlap,
} from '@/lib/skill-normalize'

describe('canonicalSkillTokens — konsep kanonik', () => {
  it('memetakan varian penulisan UX menjadi satu konsep (tidak pecah)', () => {
    expect(canonicalSkillTokens('UI/UX Design')).toEqual(['ui ux designer'])
    expect(canonicalSkillTokens('UI/UX Designer')).toEqual(['ui ux designer'])
    expect(canonicalSkillTokens('UX Designer')).toEqual(['ui ux designer'])
    expect(canonicalSkillTokens('UI Designer')).toEqual(['ui ux designer'])
    expect(canonicalSkillTokens('Desainer UI')).toEqual(['ui ux designer'])
  })

  it('memetakan penulisan Indonesia/Inggris grafis menjadi satu konsep', () => {
    expect(canonicalSkillTokens('Graphic Designer')).toEqual(['graphic designer'])
    expect(canonicalSkillTokens('Desainer Grafis')).toEqual(['graphic designer'])
    expect(canonicalSkillTokens('Desain Grafis')).toEqual(['graphic designer'])
  })

  it('menyertakan sub-frasa alias yang diapit kata jenjang', () => {
    expect(canonicalSkillTokens('Senior Frontend Engineer')).toEqual(['frontend developer'])
    expect(canonicalSkillTokens('Junior Backend Developer')).toEqual(['backend developer'])
    expect(canonicalSkillTokens('Mobile UX Designer')).toEqual(['ui ux designer'])
  })

  it('menangani nama framework dengan titik & slash-spasi', () => {
    expect(canonicalSkillTokens('Vue.js Developer')).toEqual(['vue js developer'])
    expect(canonicalSkillTokens('Next.js Developer')).toEqual(['next js developer'])
    expect(canonicalSkillTokens('Node.js Developer')).toEqual(['node js developer'])
    expect(canonicalSkillTokens('React Native Developer')).toEqual(['react native developer'])
  })

  it('memetakan frasa kerja/profesional jadi peran yang relevan', () => {
    expect(canonicalSkillTokens('Backend Engineer')).toEqual(['backend developer'])
    expect(canonicalSkillTokens('Fullstack Engineer')).toEqual(['full stack developer'])
    expect(canonicalSkillTokens('DBA')).toEqual(['database administrator'])
    expect(canonicalSkillTokens('Machine Learning')).toEqual(['machine learning engineer'])
    expect(canonicalSkillTokens('3D Artist')).toEqual(['3d artist'])
  })

  it('mempertahankan skill/teknologi bebas sebagai token per kata', () => {
    const tokens = canonicalSkillTokens(['React', 'Tailwind CSS', 'Figma'])
    expect(tokens).toContain('react')
    expect(tokens).toContain('tailwind')
    expect(tokens).toContain('css')
    expect(tokens).toContain('figma')
  })

  it('mengembalikan array kosong untuk nilai kosong', () => {
    expect(canonicalSkillTokens(null)).toEqual([])
    expect(canonicalSkillTokens(undefined)).toEqual([])
    expect(canonicalSkillTokens('')).toEqual([])
    expect(canonicalSkillTokens([])).toEqual([])
  })

  it('menghapus duplikat dan menangani string dengan koma', () => {
    expect(canonicalSkillTokens('Flutter Developer, Flutter Developer')).toEqual([
      'flutter developer',
    ])
  })
})

describe('hasSkillOverlap — gate skill rekomendasi', () => {
  it('profil UI/UX Design tidak cocok dengan lowongan Flutter/iOS', () => {
    expect(
      hasSkillOverlap('UI/UX Design', 'Flutter Developer', ['Flutter', 'Dart']),
    ).toBe(false)
    expect(
      hasSkillOverlap(['UI/UX Designer'], 'iOS Developer', ['Swift', 'Objective-C']),
    ).toBe(false)
  })

  it('profil UI/UX tetap tidak cocok walau lowongan developer mencantum "ui/ux" di tag skills', () => {
    expect(
      hasSkillOverlap('UI/UX Design', 'Android Engineer (Flutter)', ['ui/ux', 'Flutter', 'Dart']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Flutter Developer', ['ui/ux', 'android', 'ios']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Mobile Developer (Flutter)', ['ui/ux', 'ux design', 'Flutter']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Fullstack Engineer', ['ui/ux', 'React', 'Node.js']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Software Engineer', ['ui/ux', 'ux design']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Backend Developer', ['ui/ux']),
    ).toBe(false)
    expect(
      hasSkillOverlap('UI/UX Design', 'Programmer', ['ui/ux']),
    ).toBe(false)
  })

  it('profil UI/UX cocok dengan lowongan desain lewat judul', () => {
    expect(hasSkillOverlap('UI/UX Design', 'UI/UX Designer', [])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Product Designer', [])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Web UI/UX Designer', ['Figma'])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Mobile App UI/UX Designer', ['ui/ux'])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Desainer UI/UX', [])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Senior UI/UX Designer', [])).toBe(true)
    expect(hasSkillOverlap('UI/UX Design', 'Graphic Designer', [])).toBe(false)
  })

  it('profil peran lain cocok dengan judul peran yang sama, bukan tag skills', () => {
    expect(
      hasSkillOverlap('Flutter Developer', 'Flutter Developer', ['ui/ux', 'iOS']),
    ).toBe(true)
    expect(hasSkillOverlap('Flutter Developer', 'iOS Developer', ['Flutter', 'Dart'])).toBe(false)
    expect(
      hasSkillOverlap('Software Engineer', 'Senior Software Engineer', ['Java']),
    ).toBe(true)
    expect(hasSkillOverlap('Software Engineer', 'Backend Developer', ['ui/ux'])).toBe(false)
  })

  it('profil tools (tanpa peran) bertemu lewat judul atau field skills', () => {
    expect(
      hasSkillOverlap(['React'], 'Frontend Developer', ['React', 'TypeScript']),
    ).toBe(true)
    expect(
      hasSkillOverlap(['React'], 'Frontend Developer', ['Vue.js', 'TypeScript']),
    ).toBe(false)
    expect(
      hasSkillOverlap(['Figma'], 'Flutter Developer', ['Figma', 'Flutter']),
    ).toBe(true)
  })

  it('profil peran+tool tetap cocok dengan lowongan peran yang sama tanpa tool tsb', () => {
    expect(
      hasSkillOverlap(['UI/UX Design', 'Figma'], 'UI/UX Designer', ['ui/ux']),
    ).toBe(true)
  })

  it('profil tanpa skill tidak dihambat (fallback ke TF-IDF)', () => {
    expect(hasSkillOverlap(null, 'Flutter Developer', [])).toBe(true)
    expect(hasSkillOverlap([], 'Anything', [])).toBe(true)
  })
})