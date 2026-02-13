export const LOCALES = ['uz', 'ru'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export function isValidLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale)
}
