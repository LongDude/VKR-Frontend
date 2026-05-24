import type { TopicStatus } from '@/types/fieldAnalytics'

const compactNumber = new Intl.NumberFormat('ru-RU', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const integerNumber = new Intl.NumberFormat('ru-RU')

const percentNumber = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  style: 'percent',
})

const signedPercentNumber = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
  signDisplay: 'always',
  style: 'percent',
})

const decimalNumber = new Intl.NumberFormat('ru-RU', {
  maximumFractionDigits: 2,
})

export const statusLabels: Record<TopicStatus, string> = {
  emerging: 'Emerging',
  accelerating: 'Accelerating',
  popular_hot: 'Popular/hot',
  stable: 'Stable',
  declining: 'Declining',
  low_confidence: 'Low confidence',
}

export const statusColors: Record<TopicStatus, string> = {
  emerging: '#1f9d55',
  accelerating: '#2563eb',
  popular_hot: '#d97706',
  stable: '#64748b',
  declining: '#dc2626',
  low_confidence: '#9ca3af',
}

export function formatInteger(value: number): string {
  return integerNumber.format(Math.round(value))
}

export function formatCompact(value: number): string {
  return compactNumber.format(value)
}

export function formatPercent(value: number): string {
  return percentNumber.format(value)
}

export function formatSignedPercent(value: number): string {
  return signedPercentNumber.format(value)
}

export function formatDecimal(value: number): string {
  return decimalNumber.format(value)
}

export function formatMonthLabel(value: string): string {
  const [year, month] = value.split('-')
  return `${month}.${year}`
}
