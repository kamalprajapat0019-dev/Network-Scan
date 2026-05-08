import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')
  
  // If the protocol is HTTP, redirect securely to HTTPS in production
  if (proto === 'http' && process.env.NODE_ENV === 'production') {
    const secureUrl = `https://${host}${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(secureUrl, 301)
  }
  
  return NextResponse.next()
}

// Match all API paths
export const config = {
  matcher: '/api/:path*',
}
