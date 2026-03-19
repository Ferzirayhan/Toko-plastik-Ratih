const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value: number) {
  return rupiahFormatter.format(value).replace(/\u00a0/g, ' ')
}

export function parseRupiah(value: string) {
  const normalizedValue = value.replace(/[^\d]/g, '')
  return normalizedValue ? Number(normalizedValue) : 0
}
