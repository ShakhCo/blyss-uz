import crypto from 'crypto'

const API_SECRET = process.env.API_SECRET || ''

export function generateSignature(body: string, timestamp: string): string {
  const message = body + timestamp
  return crypto
    .createHmac('sha256', API_SECRET)
    .update(message)
    .digest('hex')
}

export async function signedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const body = options.body ? String(options.body) : ''
  const signature = generateSignature(body, timestamp)

  const headers = new Headers(options.headers)
  headers.set('x-timestamp', timestamp)
  headers.set('x-signature', signature)
  if (options.body) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}
