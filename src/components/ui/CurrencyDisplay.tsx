interface CurrencyDisplayProps {
  value: number
  className?: string
}

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function CurrencyDisplay({ value, className }: CurrencyDisplayProps) {
  return <span className={className}>{rupiahFormatter.format(value)}</span>
}
