import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export function formatDateIndonesia(value: string | Date, pattern = 'dd MMMM yyyy') {
  return format(new Date(value), pattern, { locale: localeId })
}

export function formatDateTimeIndonesia(value: string | Date) {
  return formatDateIndonesia(value, 'dd MMM yyyy, HH:mm')
}
