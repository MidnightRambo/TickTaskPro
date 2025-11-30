// Date utility functions

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.ceil(diffMs / (1000 * 60))

  if (diffMs < 0) {
    // Past
    const absDays = Math.abs(diffDays)
    const absHours = Math.abs(diffHours)
    const absMinutes = Math.abs(diffMinutes)

    if (absDays >= 1) {
      return `${absDays}d overdue`
    } else if (absHours >= 1) {
      return `${absHours}h overdue`
    } else {
      return `${absMinutes}m overdue`
    }
  } else {
    // Future
    if (diffDays > 7) {
      return format(date, 'MMM d')
    } else if (diffDays >= 1) {
      return `in ${diffDays}d`
    } else if (diffHours >= 1) {
      return `in ${diffHours}h`
    } else if (diffMinutes >= 1) {
      return `in ${diffMinutes}m`
    } else {
      return 'now'
    }
  }
}

export function format(date: Date, formatStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const tokens: Record<string, string> = {
    'yyyy': String(date.getFullYear()),
    'yy': String(date.getFullYear()).slice(-2),
    'MMMM': months[date.getMonth()],
    'MMM': months[date.getMonth()],
    'MM': String(date.getMonth() + 1).padStart(2, '0'),
    'M': String(date.getMonth() + 1),
    'dd': String(date.getDate()).padStart(2, '0'),
    'd': String(date.getDate()),
    'EEEE': days[date.getDay()],
    'EEE': days[date.getDay()],
    'HH': String(date.getHours()).padStart(2, '0'),
    'H': String(date.getHours()),
    'hh': String(date.getHours() % 12 || 12).padStart(2, '0'),
    'h': String(date.getHours() % 12 || 12),
    'mm': String(date.getMinutes()).padStart(2, '0'),
    'm': String(date.getMinutes()),
    'ss': String(date.getSeconds()).padStart(2, '0'),
    's': String(date.getSeconds()),
    'a': date.getHours() >= 12 ? 'PM' : 'AM',
  }

  let result = formatStr
  // Sort tokens by length (longest first) to avoid partial replacements
  const sortedTokens = Object.keys(tokens).sort((a, b) => b.length - a.length)
  
  for (const token of sortedTokens) {
    result = result.replace(new RegExp(token, 'g'), tokens[token])
  }
  
  return result
}

export function isPast(date: Date): boolean {
  return date.getTime() < new Date().getTime()
}

export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  )
}

export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get the start of the week (Monday) for a given date.
 * @param date - The date to get the start of week for
 * @param weekStartsOn - Day the week starts on (0=Sunday, 1=Monday, etc.). Default is 1 (Monday).
 * @returns The start of the week (Monday 00:00:00.000)
 */
export function startOfWeek(date: Date, weekStartsOn: number = 1): Date {
  const result = new Date(date)
  const day = result.getDay()
  // Calculate days to subtract to get to the start of the week
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get the end of the week (Sunday) for a given date.
 * @param date - The date to get the end of week for
 * @param weekStartsOn - Day the week starts on (0=Sunday, 1=Monday, etc.). Default is 1 (Monday).
 * @returns The end of the week (Sunday 23:59:59.999)
 */
export function endOfWeek(date: Date, weekStartsOn: number = 1): Date {
  const result = startOfWeek(date, weekStartsOn)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Check if a date falls within the current week (Monday to Sunday).
 * @param date - The date to check
 * @returns True if the date is within this week
 */
export function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = startOfWeek(now, 1) // Monday
  const weekEnd = endOfWeek(now, 1) // Sunday
  return date >= weekStart && date <= weekEnd
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addHours(date: Date, hours: number): Date {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7)
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  const targetMonth = result.getMonth() + months
  const targetDay = result.getDate()
  
  // Set to first day of target month first to avoid overflow issues
  result.setDate(1)
  result.setMonth(targetMonth)
  
  // Then set the day, clamping to last day of month if needed
  const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(targetDay, lastDayOfMonth))
  
  return result
}

/**
 * Get the next occurrence date after baseDate that falls on one of the specified weekdays.
 * @param baseDate - The current due date
 * @param weekdays - Array of weekday numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @returns The next valid date
 */
export function getNextWeekdayOccurrence(baseDate: Date, weekdays: number[]): Date {
  if (weekdays.length === 0) {
    // Fallback: return tomorrow if no weekdays specified
    return addDays(baseDate, 1)
  }
  
  const sortedDays = [...weekdays].sort((a, b) => a - b)
  const currentDay = baseDate.getDay()
  
  // Find the next day in the cycle after today
  let daysToAdd = 0
  let found = false
  
  // Look for the next weekday after the current day
  for (const day of sortedDays) {
    if (day > currentDay) {
      daysToAdd = day - currentDay
      found = true
      break
    }
  }
  
  // If not found (current day is >= all selected days), wrap to next week
  if (!found) {
    daysToAdd = (7 - currentDay) + sortedDays[0]
  }
  
  // Ensure we always move at least 1 day forward
  if (daysToAdd === 0) {
    daysToAdd = 7
  }
  
  return addDays(baseDate, daysToAdd)
}

/**
 * Calculate the next occurrence date based on recurrence rule.
 * @param currentDueDate - The current due date (or today if no due date)
 * @param recurrenceRule - The recurrence rule string
 * @returns The next occurrence date ISO string, or undefined if no recurrence
 */
export function calculateNextOccurrence(currentDueDate: string | undefined, recurrenceRule: string): string | undefined {
  if (!recurrenceRule) return undefined
  
  // Use current due date or today as base
  const baseDate = currentDueDate ? new Date(currentDueDate) : new Date()
  let nextDate: Date
  
  if (recurrenceRule === 'daily') {
    nextDate = addDays(baseDate, 1)
  } else if (recurrenceRule === 'weekly') {
    nextDate = addWeeks(baseDate, 1)
  } else if (recurrenceRule === 'biweekly') {
    nextDate = addWeeks(baseDate, 2)
  } else if (recurrenceRule === 'monthly') {
    nextDate = addMonths(baseDate, 1)
  } else if (recurrenceRule.startsWith('weekdays:')) {
    // Parse weekdays format: "weekdays:1,2,3,4,5"
    const daysStr = recurrenceRule.replace('weekdays:', '')
    const weekdays = daysStr.split(',').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6)
    nextDate = getNextWeekdayOccurrence(baseDate, weekdays)
  } else if (recurrenceRule === 'weekdays') {
    // Legacy format: Mon-Fri
    nextDate = getNextWeekdayOccurrence(baseDate, [1, 2, 3, 4, 5])
  } else {
    return undefined
  }
  
  return nextDate.toISOString()
}

export function formatRelative(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`
  } else {
    return format(date, 'EEE, MMM d at h:mm a')
  }
}


