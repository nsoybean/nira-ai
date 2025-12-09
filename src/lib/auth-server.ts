import { headers } from "next/headers";
import { auth } from "@/lib/auth";

/**
 * Get the current user session from Better Auth
 * Use this in API routes and server components
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
}

/**
 * Get the current userId from the session
 * Returns null if not authenticated
 */
export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}

/**
 * Require authentication - throws error if not authenticated
 * Use this to protect API routes
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new Error("Unauthorized - Please sign in");
  }

  return {
    session,
    userId: session.user.id,
    user: session.user,
  };
}
