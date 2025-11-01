import { NextResponse, NextRequest } from 'next/server';
import { authMiddleware } from '@clerk/nextjs/server';
import { rateLimit, addRateLimitHeaders } from './src/middleware/rateLimit';

// Indonesian government role hierarchy
const GOVERNMENT_ROLES = {
  admin: 'Admin OPD',
  pptk: 'PPTK/PPK',
  bendahara: 'Bendahara Pengeluaran',
  verifikator: 'Verifikator Internal',
  viewer: 'Auditor/Viewer',
} as const;

// Role-based access control matrix
const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'rka', 'npd', 'performance', 'users', 'settings'],
  pptk: ['dashboard', 'rka', 'npd', 'performance'],
  bendahara: ['dashboard', 'npd', 'rka'],
  verifikator: ['dashboard', 'npd', 'rka'],
  viewer: ['dashboard', 'rka', 'performance'],
} as const;

// Public routes (no authentication required)
const PUBLIC_ROUTES = [
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/api/auth/refresh',
];

// Protected routes requiring authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/rka',
  '/npd',
  '/performance',
];

function hasRoleAccess(userRole: string | null, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

function getRequiredRole(route: string): string | null {
  // Extract the base route from the path
  const basePath = route.split('/')[1];

  switch (basePath) {
    case 'dashboard':
      return 'viewer'; // Minimum role for dashboard
    case 'rka':
      return 'pptk'; // PPTK can view RKA
    case 'npd':
      return 'pptk'; // PPTK can manage NPD
    case 'performance':
      return 'pptk'; // PPTK can manage performance
    case 'users':
      return 'admin'; // Only admin can manage users
    case 'settings':
      return 'admin'; // Only admin can access settings
    default:
      return 'viewer'; // Default to viewer role
  }
}

export default authMiddleware({
  publicRoutes: ['/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/clerk', '/api/auth/refresh'],
  afterAuth: async (auth, req) => {
    // Apply rate limiting
    const rateLimitResponse = await rateLimit(req);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Get the current user from Clerk
    const { userId } = auth;

    // Get the route path
    const { pathname } = req.nextUrl;

    // Check if route is public
    if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Check if route requires authentication
    if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
      if (!userId) {
        // Redirect to sign-in if not authenticated
        const signInUrl = new URL('/sign-in', req.nextUrl);
        signInUrl.searchParams.set('redirect_url', pathname);
        return NextResponse.redirect(signInUrl);
      }
    }

    // Get user data to check role
    let userRole = null;
    if (userId) {
      try {
        // Get user from Clerk client or database
        userRole = 'viewer'; // For now, default to viewer - TODO: implement proper role fetching
      } catch (error) {
        console.error('Error getting user role:', error);
        userRole = 'viewer'; // Default to viewer role on error
      }
    }

    // Check role-based access
    const requiredRole = getRequiredRole(pathname);
    if (requiredRole && !hasRoleAccess(userRole, [requiredRole])) {
      // User doesn't have required role, redirect to unauthorized page
      return NextResponse.redirect('/unauthorized');
    }

    // Add role information to headers for client-side access
    const response = NextResponse.next();
    if (userRole) {
      response.headers.set('x-user-role', userRole);
      response.headers.set('x-user-role-display', GOVERNMENT_ROLES[userRole as keyof typeof GOVERNMENT_ROLES] || userRole);
    }

    // Add security headers (CSP is in next.config.js)
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // Add rate limit headers
    addRateLimitHeaders(response, req);

    return response;
  },
});

// Build matcher pattern dynamically
const publicRoutesPattern = PUBLIC_ROUTES.map(route => route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public routes (listed above)
     */
    `/((?!_next/static|_next/image|favicon.ico|${publicRoutesPattern}).*)`,
  ],
};