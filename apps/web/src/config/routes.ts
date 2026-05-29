/**
 * Route definitions
 */

export const routes = {
  public: [
    '/',
    '/auth/connect',
  ],
  protected: [
    '/dashboard',
    '/dashboard/communities',
    '/dashboard/messages',
    '/dashboard/governance',
    '/dashboard/storage',
    '/dashboard/settings',
  ],
} as const;

export function isPublicRoute(path: string): boolean {
  return routes.public.some(route => path.startsWith(route));
}

export function isProtectedRoute(path: string): boolean {
  return routes.protected.some(route => path.startsWith(route));
}
