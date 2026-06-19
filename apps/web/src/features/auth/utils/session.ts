/**
 * Session utility to handle auth cookies
 * 
 * Used for syncing tokens with cookies so Next.js middleware
 * can read them during SSR and route protection.
 */

const TOKEN_KEY = 'aether_token';
const REFRESH_TOKEN_KEY = 'aether_refresh_token';

export function setSessionCookies(accessToken: string, refreshToken: string) {
  // Set access token cookie (valid for 15 minutes, matches backend)
  const accessExpires = new Date(Date.now() + 15 * 60 * 1000).toUTCString();
  document.cookie = `${TOKEN_KEY}=${accessToken}; path=/; expires=${accessExpires}; SameSite=Lax`;

  // Set refresh token cookie (valid for 7 days, matches backend)
  const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; expires=${refreshExpires}; SameSite=Lax`;
}

export function clearSessionCookies() {
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getAccessTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${TOKEN_KEY}=([^;]+)`));
  return match ? (match[2] ?? null) : null;
}
