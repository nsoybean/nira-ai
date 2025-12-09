"use client";

/**
 * ClientInit component
 * Initializes client-side features that need to run once on app load
 *
 * Note: Fetch interceptor disabled - now using Better Auth with cookies
 * which are automatically sent with requests
 */
export function ClientInit() {
  // No initialization needed - Better Auth handles authentication via cookies

  return null;
}
