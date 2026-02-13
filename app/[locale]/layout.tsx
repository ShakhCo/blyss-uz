import { redirect } from 'next/navigation'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { LocaleProvider } from '@/lib/locale-context'

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    redirect(`/${DEFAULT_LOCALE}`)
  }

  return (
    <LocaleProvider locale={locale as Locale}>{children}</LocaleProvider>
  )
}
