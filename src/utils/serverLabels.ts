import { i18n } from '@/i18n'

function enumLabel(group: string, value: string | null): string {
  if (!value) {
    return ''
  }

  const key = `enums.${group}.${value}`
  return i18n.global.te(key) ? i18n.global.t(key) : value
}

export const panelLabel = (value: string): string => enumLabel('panel', value)
export const presetLabel = (value: string | null): string => enumLabel('preset', value)
export const workflowStatusLabel = (value: string | null): string => enumLabel('status', value)
export const workflowStageLabel = (value: string | null): string => enumLabel('stage', value)
export const strategyLabel = (value: string | null): string => enumLabel('strategy', value)
export const reasonSelectedLabel = (value: string): string => enumLabel('reason', value)
