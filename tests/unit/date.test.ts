import { parseExifDate, parseGpsDateTime, formatDelta } from '@/lib/utils/date'

describe('parseExifDate', () => {
  it('parses standard EXIF format', () => {
    const ms = parseExifDate('2024:06:15 10:23:45')
    expect(ms).not.toBeNull()
    expect(new Date(ms!).toISOString()).toBe('2024-06-15T10:23:45.000Z')
  })

  it('returns null for empty string', () => {
    expect(parseExifDate('')).toBeNull()
  })

  it('returns null for invalid date', () => {
    expect(parseExifDate('not-a-date')).toBeNull()
  })

  it('handles already-normalized format', () => {
    const ms = parseExifDate('2024-06-15 10:23:45')
    expect(ms).not.toBeNull()
    expect(new Date(ms!).toISOString()).toBe('2024-06-15T10:23:45.000Z')
  })

  it('does not mutate the input string', () => {
    const input = '2024:06:15 10:00:00'
    parseExifDate(input)
    expect(input).toBe('2024:06:15 10:00:00')
  })
})

describe('parseGpsDateTime', () => {
  it('parses GPS date + time stamp', () => {
    const ms = parseGpsDateTime('2024:06:15', [10, 23, 45])
    expect(ms).not.toBeNull()
    expect(new Date(ms!).toISOString()).toBe('2024-06-15T10:23:45.000Z')
  })

  it('returns null when dateStamp is missing', () => {
    expect(parseGpsDateTime(undefined, [10, 0, 0])).toBeNull()
  })

  it('returns null when timeStamp is missing', () => {
    expect(parseGpsDateTime('2024:06:15', undefined)).toBeNull()
  })

  it('handles fractional seconds', () => {
    const ms = parseGpsDateTime('2024:06:15', [10, 23, 45.5])
    expect(ms).not.toBeNull()
    expect(ms! % 1000).toBe(500)
  })
})

describe('formatDelta', () => {
  it('formats sub-second delta', () => {
    expect(formatDelta(500)).toBe('+500ms')
  })

  it('formats seconds', () => {
    expect(formatDelta(35_000)).toBe('+35s')
  })

  it('formats minutes and seconds', () => {
    expect(formatDelta(90_000)).toBe('+1m 30s')
  })

  it('formats hours and minutes', () => {
    expect(formatDelta(3_661_000)).toBe('+1h 1m')
  })

  it('formats negative delta with minus sign', () => {
    expect(formatDelta(-30_000)).toBe('-30s')
  })
})
