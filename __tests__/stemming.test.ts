import { describe, it, expect } from '@jest/globals'
import { stemIndonesian } from '@/lib/preprocessing'

describe('Stemming Indonesia (konservatif)', () => {
  it('menyatukan variasi imbuhan verba', () => {
    expect(stemIndonesian('menggunakan')).toBe('guna')
    expect(stemIndonesian('membangun')).toBe('bangun')
    expect(stemIndonesian('melamar')).toBe('lamar')
    expect(stemIndonesian('dilakukan')).toBe('laku')
  })

  it('menyatukan mengembangkan dan pengembangan → kembang', () => {
    expect(stemIndonesian('mengembangkan')).toBe('kembang')
    expect(stemIndonesian('pengembangan')).toBe('kembang')
  })

  it('menangani awalan nasal dengan pemulihan konsonan', () => {
    expect(stemIndonesian('menambahkan')).toBe('tambah')
    expect(stemIndonesian('penambahan')).toBe('tambah')
    expect(stemIndonesian('menyediakan')).toBe('sedia')
    expect(stemIndonesian('penjelasan')).toBe('jelas')
    expect(stemIndonesian('penempatan')).toBe('tempat')
  })

  it('tidak mengubah kata yang sudah berupa akar', () => {
    expect(stemIndonesian('backend')).toBe('backend')
    expect(stemIndonesian('developer')).toBe('developer')
    expect(stemIndonesian('informatika')).toBe('informatika')
    expect(stemIndonesian('akuntansi')).toBe('akuntansi')
  })

  it('melindungi kata brand/teknis', () => {
    expect(stemIndonesian('laravel')).toBe('laravel')
    expect(stemIndonesian('react')).toBe('react')
    expect(stemIndonesian('mysql')).toBe('mysql')
    expect(stemIndonesian('kubernetes')).toBe('kubernetes')
  })

  it('tidak menyentuh kata pendek', () => {
    expect(stemIndonesian('web')).toBe('web')
    expect(stemIndonesian('api')).toBe('api')
    expect(stemIndonesian('ui')).toBe('ui')
    expect(stemIndonesian('solo')).toBe('solo')
  })
})