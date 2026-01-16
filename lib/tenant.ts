import { headers } from 'next/headers'

const MAIN_DOMAIN = 'blyss.uz'
const LOCAL_DOMAIN = 'localhost'
const RESERVED_SUBDOMAINS = ['www', 'app', 'admin', 'api', 'cdn', 'static', 'mail']

export type TenantSlug = string

export interface TenantInfo {
  slug: TenantSlug
  isTenant: boolean
}

/**
 * Get the current tenant from the request headers
 * Call this only in Server Components or Route Handlers
 */
export async function getTenant(): Promise<TenantInfo> {
  const headersList = await headers()
  const host = headersList.get('host') || ''

  const subdomain = getSubdomainFromHost(host)
  const isTenant = subdomain !== null && !RESERVED_SUBDOMAINS.includes(subdomain)

  return {
    slug: isTenant ? subdomain! : '',
    isTenant,
  }
}

/**
 * Extract subdomain from hostname
 */
export function getSubdomainFromHost(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0]
  const parts = hostWithoutPort.split('.')

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

/**
 * Get full URL for a tenant
 */
export function getTenantUrl(tenantSlug: string, path: string = ''): string {
  return `https://${tenantSlug}.${MAIN_DOMAIN}${path}`
}

/**
 * Check if a subdomain is reserved
 */
export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_SUBDOMAINS.includes(subdomain)
}

/**
 * Validate tenant slug format
 */
export function isValidTenantSlug(slug: string): boolean {
  // Only lowercase alphanumeric and hyphens, 3-50 chars
  const regex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$|^[a-z0-9]$/
  return regex.test(slug) && !isReservedSubdomain(slug)
}
