const KYIV_TIME_ZONE = 'Europe/Kyiv'

type KyivTimeOptions = {
  includeDate?: boolean
  fallbackDate?: string
}

function getDateFromUtcClock(value: string, fallbackDate: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})\s*UTC$/i)

  if (!match) {
    return undefined
  }

  const fallback = new Date(fallbackDate)

  if (Number.isNaN(fallback.getTime())) {
    return undefined
  }

  const year = fallback.getUTCFullYear()
  const month = String(fallback.getUTCMonth() + 1).padStart(2, '0')
  const day = String(fallback.getUTCDate()).padStart(2, '0')
  const hour = match[1].padStart(2, '0')
  const minute = match[2]

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`)
}

function normalizeDate(value: Date | string, fallbackDate?: string) {
  if (value instanceof Date) {
    return value
  }

  const fromUtcClock = fallbackDate ? getDateFromUtcClock(value, fallbackDate) : undefined
  const parsed = fromUtcClock ?? new Date(value)

  return parsed
}

export function formatKyivTime(value: Date | string, options: KyivTimeOptions = {}) {
  const date = normalizeDate(value, options.fallbackDate)

  if (Number.isNaN(date.getTime())) {
    return 'час недоступний'
  }

  const formatter = new Intl.DateTimeFormat('uk-UA', {
    ...(options.includeDate ? { day: 'numeric', month: 'long' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    timeZone: KYIV_TIME_ZONE,
  })

  return `${formatter.format(date)} Київ`
}

