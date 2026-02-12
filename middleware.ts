import { NextRequest, NextResponse } from 'next/server'

const MAIN_DOMAIN = 'blyss.uz'
const LOCAL_DOMAIN = 'localhost'

// List of subdomains that should NOT be treated as tenants
const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'cdn', 'static', 'mail']

export function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get('host') || ''

  // Remove port if present (e.g., localhost:3000)
  const hostWithoutPort = hostname.split(':')[0]

  // Get the subdomain
  const subdomain = getSubdomain(hostWithoutPort)

  // If accessing main domain or reserved subdomain, continue normally
  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain)) {
    return NextResponse.next()
  }

  // Rewrite tenant subdomain to [tenant] route
  // e.g., store1.blyss.uz -> /store1/...
  // e.g., store1.localhost -> /store1/...
  url.pathname = `/${subdomain}${url.pathname}`

  return NextResponse.rewrite(url)
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
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
