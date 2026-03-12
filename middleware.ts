import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  // Get the pathname
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedRoutes = ['/home', '/dashboard', '/review', '/workspace']
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Public routes that don't require authentication
  const publicRoutes = ['/auth', '/api', '/_next']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  if (!isPublicRoute && isProtectedRoute) {
    // Check if user has a session
    const session = response.headers.get('x-session')

    if (!session) {
      const redirectUrl = new URL('/auth/sign-up', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
