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

export function formatRelative(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`
  } else if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, 'h:mm a')}`
  } else {
    return format(date, 'EEE, MMM d at h:mm a')
  }
}


