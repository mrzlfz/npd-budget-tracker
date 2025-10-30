/**
 * Format currency in Indonesian Rupiah format
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return 'Rp 0'

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with Indonesian locale
 */
export function formatNumber(number: number): string {
  return new Intl.NumberFormat('id-ID').format(number)
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format date in Indonesian locale
 */
export function formatDate(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format date with time
 */
export function formatDateTime(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date
  return dateObj.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Get fiscal year from date
 */
export function getFiscalYear(date: Date = new Date()): number {
  // Indonesian fiscal year runs from January to December
  return date.getFullYear()
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}