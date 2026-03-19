export function buildWhatsAppUrl(message: string, phoneNumber?: string) {
  const cleanedNumber = phoneNumber?.replace(/[^\d]/g, '') ?? ''
  const baseUrl = cleanedNumber ? `https://wa.me/${cleanedNumber}` : 'https://wa.me/'
  return `${baseUrl}?text=${encodeURIComponent(message)}`
}
