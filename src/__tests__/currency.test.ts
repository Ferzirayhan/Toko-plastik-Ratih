import { describe, expect, it } from 'vitest'
import { formatRupiah, parseRupiah } from '../utils/currency'

describe('formatRupiah', () => {
  it('format 0', () => expect(formatRupiah(0)).toBe('Rp 0'))
  it('format ribuan', () => expect(formatRupiah(1000)).toBe('Rp 1.000'))
  it('format jutaan', () => expect(formatRupiah(1500000)).toBe('Rp 1.500.000'))
  it('format dengan desimal dibulatkan', () => expect(formatRupiah(999.9)).toBe('Rp 1.000'))
})

describe('parseRupiah', () => {
  it('parse string dengan titik', () => expect(parseRupiah('1.500.000')).toBe(1500000))
  it('parse string kosong ke 0', () => expect(parseRupiah('')).toBe(0))
  it('parse string Rp prefix', () => expect(parseRupiah('Rp 25.000')).toBe(25000))
})
