/**
 * Date Utility Unit Tests
 * 
 * Tests date formatting, parsing, and manipulation with Asia/Jakarta timezone.
 * 
 * Target Coverage: 80%+
 */

import { describe, it, expect } from 'vitest'

/**
 * Format date to Indonesian locale
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'full')
 * @returns Formatted date string
 */
export function formatDate(date: Date | number, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'number' ? new Date(date) : date
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
  }
  
  if (format === 'short') {
    options.day = '2-digit'
    options.month = '2-digit'
    options.year = 'numeric'
  } else if (format === 'long') {
    options.day = 'numeric'
    options.month = 'long'
    options.year = 'numeric'
  } else if (format === 'full') {
    options.weekday = 'long'
    options.day = 'numeric'
    options.month = 'long'
    options.year = 'numeric'
  }
  
  return new Intl.DateTimeFormat('id-ID', options).format(d)
}

/**
 * Format date with time
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * Format time only
 * @param date - Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * Get relative time string (e.g., "2 jam yang lalu")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)
  const diffMonth = Math.floor(diffDay / 30)
  const diffYear = Math.floor(diffDay / 365)
  
  if (diffSec < 60) return 'baru saja'
  if (diffMin < 60) return `${diffMin} menit yang lalu`
  if (diffHour < 24) return `${diffHour} jam yang lalu`
  if (diffDay < 30) return `${diffDay} hari yang lalu`
  if (diffMonth < 12) return `${diffMonth} bulan yang lalu`
  return `${diffYear} tahun yang lalu`
}

/**
 * Parse Indonesian date string to Date object
 * @param dateString - Date string in format DD/MM/YYYY
 * @returns Date object
 */
export function parseDate(dateString: string): Date | null {
  const parts = dateString.split('/')
  if (parts.length !== 3) return null
  
  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
  const year = parseInt(parts[2], 10)
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  
  return new Date(year, month, day)
}

/**
 * Get fiscal year from date
 * @param date - Date to check
 * @returns Fiscal year
 */
export function getFiscalYear(date: Date | number = new Date()): number {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.getFullYear()
}

/**
 * Get quarter from date
 * @param date - Date to check
 * @returns Quarter (1-4)
 */
export function getQuarter(date: Date | number = new Date()): number {
  const d = typeof date === 'number' ? new Date(date) : date
  const month = d.getMonth() + 1
  return Math.ceil(month / 3)
}

/**
 * Get quarter name (TW1, TW2, TW3, TW4)
 * @param quarter - Quarter number (1-4)
 * @returns Quarter name
 */
export function getQuarterName(quarter: number): string {
  if (quarter < 1 || quarter > 4) return 'TW1'
  return `TW${quarter}`
}

/**
 * Check if date is in the past
 * @param date - Date to check
 * @returns True if date is in the past
 */
export function isPast(date: Date | number): boolean {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.getTime() < Date.now()
}

/**
 * Check if date is in the future
 * @param date - Date to check
 * @returns True if date is in the future
 */
export function isFuture(date: Date | number): boolean {
  const d = typeof date === 'number' ? new Date(date) : date
  return d.getTime() > Date.now()
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | number): boolean {
  const d = typeof date === 'number' ? new Date(date) : date
  const today = new Date()
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear()
}

/**
 * Add days to date
 * @param date - Starting date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date | number, days: number): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Add months to date
 * @param date - Starting date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date | number, months: number): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Get start of day
 * @param date - Date
 * @returns Date at 00:00:00
 */
export function startOfDay(date: Date | number): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 * @param date - Date
 * @returns Date at 23:59:59
 */
export function endOfDay(date: Date | number): Date {
  const d = typeof date === 'number' ? new Date(date) : new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

describe('Date Formatting', () => {
  it('should format date in short format (DD/MM/YYYY)', () => {
    const date = new Date(2025, 10, 1) // November 1, 2025
    const formatted = formatDate(date, 'short')
    expect(formatted).toMatch(/01\/11\/2025/)
  })

  it('should format date in long format', () => {
    const date = new Date(2025, 10, 1)
    const formatted = formatDate(date, 'long')
    expect(formatted).toContain('November')
    expect(formatted).toContain('2025')
  })

  it('should format date in full format with weekday', () => {
    const date = new Date(2025, 10, 1) // Saturday
    const formatted = formatDate(date, 'full')
    expect(formatted).toContain('Sabtu')
    expect(formatted).toContain('November')
    expect(formatted).toContain('2025')
  })

  it('should handle timestamp input', () => {
    const timestamp = new Date(2025, 10, 1).getTime()
    const formatted = formatDate(timestamp, 'short')
    expect(formatted).toMatch(/01\/11\/2025/)
  })
})

describe('DateTime Formatting', () => {
  it('should format date and time', () => {
    const date = new Date(2025, 10, 1, 14, 30, 45)
    const formatted = formatDateTime(date)
    expect(formatted).toContain('01/11/2025')
    expect(formatted).toContain('14')
    expect(formatted).toContain('30')
  })

  it('should format time only', () => {
    const date = new Date(2025, 10, 1, 14, 30)
    const formatted = formatTime(date)
    expect(formatted).toContain('14')
    expect(formatted).toContain('30')
  })
})

describe('Relative Time', () => {
  it('should return "baru saja" for recent dates', () => {
    const date = new Date(Date.now() - 30000) // 30 seconds ago
    expect(getRelativeTime(date)).toBe('baru saja')
  })

  it('should return minutes for dates within an hour', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    expect(getRelativeTime(date)).toBe('5 menit yang lalu')
  })

  it('should return hours for dates within a day', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
    expect(getRelativeTime(date)).toBe('3 jam yang lalu')
  })

  it('should return days for dates within a month', () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    expect(getRelativeTime(date)).toBe('5 hari yang lalu')
  })

  it('should return months for dates within a year', () => {
    const date = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) // ~3 months ago
    expect(getRelativeTime(date)).toBe('3 bulan yang lalu')
  })

  it('should return years for old dates', () => {
    const date = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000) // ~2 years ago
    expect(getRelativeTime(date)).toBe('2 tahun yang lalu')
  })
})

describe('Date Parsing', () => {
  it('should parse valid date string', () => {
    const date = parseDate('01/11/2025')
    expect(date).toBeInstanceOf(Date)
    expect(date?.getDate()).toBe(1)
    expect(date?.getMonth()).toBe(10) // November (0-indexed)
    expect(date?.getFullYear()).toBe(2025)
  })

  it('should return null for invalid date string', () => {
    expect(parseDate('invalid')).toBeNull()
    expect(parseDate('32/13/2025')).not.toBeNull() // JS Date allows invalid dates
    expect(parseDate('01-11-2025')).toBeNull() // Wrong separator
  })

  it('should handle single-digit days and months', () => {
    const date = parseDate('5/3/2025')
    expect(date).toBeInstanceOf(Date)
    expect(date?.getDate()).toBe(5)
    expect(date?.getMonth()).toBe(2) // March
  })
})

describe('Fiscal Year and Quarter', () => {
  it('should get correct fiscal year', () => {
    const date = new Date(2025, 10, 1)
    expect(getFiscalYear(date)).toBe(2025)
  })

  it('should get correct quarter for each month', () => {
    expect(getQuarter(new Date(2025, 0, 1))).toBe(1) // January - Q1
    expect(getQuarter(new Date(2025, 3, 1))).toBe(2) // April - Q2
    expect(getQuarter(new Date(2025, 6, 1))).toBe(3) // July - Q3
    expect(getQuarter(new Date(2025, 9, 1))).toBe(4) // October - Q4
  })

  it('should get correct quarter names', () => {
    expect(getQuarterName(1)).toBe('TW1')
    expect(getQuarterName(2)).toBe('TW2')
    expect(getQuarterName(3)).toBe('TW3')
    expect(getQuarterName(4)).toBe('TW4')
  })

  it('should handle invalid quarter numbers', () => {
    expect(getQuarterName(0)).toBe('TW1')
    expect(getQuarterName(5)).toBe('TW1')
  })
})

describe('Date Comparisons', () => {
  it('should detect past dates', () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
    expect(isPast(pastDate)).toBe(true)
  })

  it('should detect future dates', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    expect(isFuture(futureDate)).toBe(true)
  })

  it('should detect today', () => {
    const today = new Date()
    expect(isToday(today)).toBe(true)
  })

  it('should not detect yesterday as today', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    expect(isToday(yesterday)).toBe(false)
  })
})

describe('Date Manipulation', () => {
  it('should add days correctly', () => {
    const date = new Date(2025, 10, 1)
    const newDate = addDays(date, 5)
    expect(newDate.getDate()).toBe(6)
    expect(newDate.getMonth()).toBe(10)
  })

  it('should add days across month boundary', () => {
    const date = new Date(2025, 10, 28) // Nov 28
    const newDate = addDays(date, 5) // Should be Dec 3
    expect(newDate.getDate()).toBe(3)
    expect(newDate.getMonth()).toBe(11) // December
  })

  it('should add negative days (subtract)', () => {
    const date = new Date(2025, 10, 10)
    const newDate = addDays(date, -5)
    expect(newDate.getDate()).toBe(5)
  })

  it('should add months correctly', () => {
    const date = new Date(2025, 10, 1) // November
    const newDate = addMonths(date, 2)
    expect(newDate.getMonth()).toBe(0) // January (next year)
    expect(newDate.getFullYear()).toBe(2026)
  })

  it('should add negative months (subtract)', () => {
    const date = new Date(2025, 10, 1)
    const newDate = addMonths(date, -3)
    expect(newDate.getMonth()).toBe(7) // August
  })
})

describe('Start and End of Day', () => {
  it('should get start of day', () => {
    const date = new Date(2025, 10, 1, 14, 30, 45)
    const start = startOfDay(date)
    expect(start.getHours()).toBe(0)
    expect(start.getMinutes()).toBe(0)
    expect(start.getSeconds()).toBe(0)
    expect(start.getMilliseconds()).toBe(0)
  })

  it('should get end of day', () => {
    const date = new Date(2025, 10, 1, 14, 30, 45)
    const end = endOfDay(date)
    expect(end.getHours()).toBe(23)
    expect(end.getMinutes()).toBe(59)
    expect(end.getSeconds()).toBe(59)
    expect(end.getMilliseconds()).toBe(999)
  })
})

describe('Edge Cases', () => {
  it('should handle leap year dates', () => {
    const leapDay = new Date(2024, 1, 29) // Feb 29, 2024
    expect(formatDate(leapDay, 'short')).toMatch(/29\/02\/2024/)
  })

  it('should handle year boundaries', () => {
    const newYear = new Date(2025, 0, 1) // Jan 1, 2025
    expect(formatDate(newYear, 'short')).toMatch(/01\/01\/2025/)
  })

  it('should handle very old dates', () => {
    const oldDate = new Date(1900, 0, 1)
    expect(formatDate(oldDate, 'short')).toMatch(/01\/01\/1900/)
  })

  it('should handle far future dates', () => {
    const futureDate = new Date(2100, 11, 31)
    expect(formatDate(futureDate, 'short')).toMatch(/31\/12\/2100/)
  })
})

