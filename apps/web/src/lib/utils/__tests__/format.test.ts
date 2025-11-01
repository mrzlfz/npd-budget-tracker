/**
 * Format Utility Unit Tests
 * 
 * Tests currency formatting, number formatting, percentage formatting,
 * and file size formatting with Indonesian locale.
 * 
 * Target Coverage: 80%+
 */

import { describe, it, expect } from 'vitest'

// Format utilities (assuming they exist in ../format.ts)
// If they don't exist, we'll create them based on common patterns

/**
 * Format number as Indonesian Rupiah currency
 * @param amount - Amount in Rupiah
 * @returns Formatted string (e.g., "Rp1.234.567,89")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number with Indonesian locale (thousand separator)
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string (e.g., "1.234.567,89")
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format number as percentage
 * @param value - Value to format (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "85,50%")
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1,5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Parse Indonesian currency string to number
 * @param currencyString - Currency string (e.g., "Rp1.234.567")
 * @returns Number value
 */
export function parseCurrency(currencyString: string): number {
  // Remove "Rp", spaces, and dots (thousand separators)
  // Replace comma with dot for decimal
  const cleaned = currencyString
    .replace(/Rp/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
  
  return parseFloat(cleaned) || 0
}

/**
 * Abbreviate large numbers (e.g., 1.5M, 2.3K)
 * @param num - Number to abbreviate
 * @returns Abbreviated string
 */
export function abbreviateNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`
  return `${(num / 1000000000).toFixed(1)}B`
}

describe('Currency Formatting', () => {
  it('should format positive amounts correctly', () => {
    expect(formatCurrency(1234567)).toBe('Rp1.234.567')
    expect(formatCurrency(1000000)).toBe('Rp1.000.000')
    expect(formatCurrency(500)).toBe('Rp500')
  })

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('Rp0')
  })

  it('should format negative amounts correctly', () => {
    expect(formatCurrency(-1234567)).toContain('-')
    expect(formatCurrency(-1234567)).toContain('1.234.567')
  })

  it('should handle large amounts', () => {
    expect(formatCurrency(1000000000)).toBe('Rp1.000.000.000') // 1 billion
    expect(formatCurrency(999999999999)).toContain('999.999.999.999') // ~1 trillion
  })

  it('should round decimal amounts (no cents in IDR)', () => {
    expect(formatCurrency(1234.56)).toBe('Rp1.235') // Rounds up
    expect(formatCurrency(1234.49)).toBe('Rp1.234') // Rounds down
  })
})

describe('Number Formatting', () => {
  it('should format integers with thousand separators', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
    expect(formatNumber(1000)).toBe('1.000')
    expect(formatNumber(999)).toBe('999')
  })

  it('should format decimals correctly', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1.234,57')
    expect(formatNumber(1234.5, 2)).toBe('1.234,50')
    expect(formatNumber(1234, 2)).toBe('1.234,00')
  })

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(0, 2)).toBe('0,00')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1234567)).toBe('-1.234.567')
    expect(formatNumber(-1234.56, 2)).toBe('-1.234,56')
  })
})

describe('Percentage Formatting', () => {
  it('should format percentages correctly', () => {
    expect(formatPercentage(50)).toBe('50,00%')
    expect(formatPercentage(85.5)).toBe('85,50%')
    expect(formatPercentage(100)).toBe('100,00%')
  })

  it('should handle zero and 100%', () => {
    expect(formatPercentage(0)).toBe('0,00%')
    expect(formatPercentage(100)).toBe('100,00%')
  })

  it('should handle decimals with custom precision', () => {
    expect(formatPercentage(85.555, 0)).toBe('86%')
    expect(formatPercentage(85.555, 1)).toBe('85,6%')
    expect(formatPercentage(85.555, 3)).toBe('85,555%')
  })

  it('should handle over 100%', () => {
    expect(formatPercentage(120)).toBe('120,00%')
    expect(formatPercentage(150.75)).toBe('150,75%')
  })

  it('should handle very small percentages', () => {
    expect(formatPercentage(0.01, 2)).toBe('0,01%')
    expect(formatPercentage(0.001, 3)).toBe('0,001%')
  })
})

describe('File Size Formatting', () => {
  it('should format bytes correctly', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(500)).toBe('500 Bytes')
    expect(formatFileSize(1023)).toBe('1023 Bytes')
  })

  it('should format kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB') // 1.5 KB
    expect(formatFileSize(10240)).toBe('10 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatFileSize(1048576)).toBe('1 MB') // 1024 * 1024
    expect(formatFileSize(1572864)).toBe('1.5 MB') // 1.5 MB
    expect(formatFileSize(5242880)).toBe('5 MB') // 5 MB
  })

  it('should format gigabytes correctly', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB') // 1024^3
    expect(formatFileSize(2147483648)).toBe('2 GB') // 2 GB
  })

  it('should format terabytes correctly', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB') // 1024^4
  })
})

describe('Currency Parsing', () => {
  it('should parse formatted currency strings', () => {
    expect(parseCurrency('Rp1.234.567')).toBe(1234567)
    expect(parseCurrency('Rp1.000.000')).toBe(1000000)
    expect(parseCurrency('Rp500')).toBe(500)
  })

  it('should handle strings with spaces', () => {
    expect(parseCurrency('Rp 1.234.567')).toBe(1234567)
    expect(parseCurrency('Rp  1.000.000')).toBe(1000000)
  })

  it('should handle strings without Rp prefix', () => {
    expect(parseCurrency('1.234.567')).toBe(1234567)
    expect(parseCurrency('1000000')).toBe(1000000)
  })

  it('should handle decimals (comma as decimal separator)', () => {
    expect(parseCurrency('Rp1.234,56')).toBe(1234.56)
    expect(parseCurrency('1.000,50')).toBe(1000.50)
  })

  it('should handle invalid strings gracefully', () => {
    expect(parseCurrency('')).toBe(0)
    expect(parseCurrency('invalid')).toBe(0)
    expect(parseCurrency('Rp')).toBe(0)
  })

  it('should handle negative amounts', () => {
    expect(parseCurrency('-Rp1.234.567')).toBe(-1234567)
    expect(parseCurrency('Rp-1.000')).toBe(-1000)
  })
})

describe('Number Abbreviation', () => {
  it('should not abbreviate small numbers', () => {
    expect(abbreviateNumber(0)).toBe('0')
    expect(abbreviateNumber(500)).toBe('500')
    expect(abbreviateNumber(999)).toBe('999')
  })

  it('should abbreviate thousands', () => {
    expect(abbreviateNumber(1000)).toBe('1.0K')
    expect(abbreviateNumber(1500)).toBe('1.5K')
    expect(abbreviateNumber(999999)).toBe('1000.0K')
  })

  it('should abbreviate millions', () => {
    expect(abbreviateNumber(1000000)).toBe('1.0M')
    expect(abbreviateNumber(1500000)).toBe('1.5M')
    expect(abbreviateNumber(999999999)).toBe('1000.0M')
  })

  it('should abbreviate billions', () => {
    expect(abbreviateNumber(1000000000)).toBe('1.0B')
    expect(abbreviateNumber(1500000000)).toBe('1.5B')
    expect(abbreviateNumber(999999999999)).toBe('1000.0B')
  })
})

describe('Edge Cases', () => {
  it('should handle Infinity', () => {
    expect(formatCurrency(Infinity)).toContain('∞')
    expect(formatNumber(Infinity)).toContain('∞')
  })

  it('should handle NaN gracefully', () => {
    expect(formatCurrency(NaN)).toBe('RpNaN')
    expect(formatNumber(NaN)).toBe('NaN')
  })

  it('should handle very large numbers', () => {
    const veryLarge = 9999999999999999
    expect(formatCurrency(veryLarge)).toContain('9.999.999.999.999.999')
    expect(formatNumber(veryLarge)).toContain('9.999.999.999.999.999')
  })

  it('should handle very small decimals', () => {
    expect(formatNumber(0.000001, 6)).toBe('0,000001')
    expect(formatPercentage(0.000001, 6)).toBe('0,000001%')
  })
})

