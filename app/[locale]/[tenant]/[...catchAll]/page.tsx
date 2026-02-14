import { redirect } from 'next/navigation'
import { isValidLocale, DEFAULT_LOCALE } from '@/lib/i18n'

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  const locale = isValidLocale(localeParam) ? localeParam : DEFAULT_LOCALE
  redirect(`/${locale}`)
}
