import { NextRequest, NextResponse } from 'next/server'
import { LOCALES, DEFAULT_LOCALE } from '@/lib/i18n'

const MAIN_DOMAIN = 'blyss.uz'
const LOCAL_DOMAIN = 'localhost'

// List of subdomains that should NOT be treated as tenants
const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'cdn', 'static', 'mail']

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const hostname = request.headers.get('host') || ''
  const hostWithoutPort = hostname.split(':')[0]

  const subdomain = getSubdomain(hostWithoutPort)
  const pathname = url.pathname

  // Extract path segments
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0] || ''
  const hasLocale = (LOCALES as readonly string[]).includes(firstSegment)
  const locale = hasLocale ? firstSegment : DEFAULT_LOCALE

  // Tenant subdomain request
  if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain)) {
    if (!hasLocale) {
      url.pathname = `/${DEFAULT_LOCALE}${pathname}`
      return NextResponse.redirect(url)
    }

    // Guard: if path already contains the subdomain as the second segment,
    // don't double-rewrite
    if (segments[1] === subdomain) {
      const headers = new Headers(request.headers)
      headers.set('x-locale', locale)
      return NextResponse.rewrite(url, { request: { headers } })
    }

    // Rewrite /{locale}/... -> /{locale}/{subdomain}/...
    const rest = '/' + segments.slice(1).join('/')
    url.pathname = `/${locale}/${subdomain}${rest === '/' ? '' : rest}`

    const headers = new Headers(request.headers)
    headers.set('x-locale', locale)
    return NextResponse.rewrite(url, { request: { headers } })
  }

  // Main domain request (no subdomain)
  if (!hasLocale) {
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`
    return NextResponse.redirect(url)
  }

  const headers = new Headers(request.headers)
  headers.set('x-locale', locale)
  return NextResponse.next({ request: { headers } })
}

function getSubdomain(host: string): string | null {
  const parts = host.split('.')

  // Handle production: [tenant].blyss.uz
  if (parts.length >= 2) {
    const domain = parts.slice(-2).join('.')
    if (domain === MAIN_DOMAIN && parts.length > 2) {
      return parts[0]
    }
  }

  // Handle local development: [tenant].localhost
  if (parts.length === 2 && parts[1] === LOCAL_DOMAIN) {
    return parts[0]
  }

  return null
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
