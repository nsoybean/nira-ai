import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Custom error class for unauthorized access
 */
export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized - Please sign in") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

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
 * Require authentication - throws UnauthorizedError if not authenticated
 * Use this to protect API routes
 *
 * @example
 * ```ts
 * export async function GET() {
 *   try {
 *     const { userId, user } = await requireAuth();
 *     // Your protected logic here
 *   } catch (error) {
 *     return handleAuthError(error);
 *   }
 * }
 * ```
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session || !session.user) {
    throw new UnauthorizedError("Unauthorized - Please sign in");
  }

  return {
    session,
    userId: session.user.id,
    user: session.user,
  };
}

/**
 * Handle authentication errors and return proper 401 response
 * Use this in catch blocks for protected routes
 */
export function handleAuthError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: error.message,
        code: "AUTH_REQUIRED",
      },
      { status: 401 }
    );
  }

  // For other errors, return 500
  console.error("Auth error:", error);
  return NextResponse.json(
    {
      error: "Internal Server Error",
      message: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 }
  );
}

/**
 * Wrapper function to protect API route handlers
 * Automatically handles authentication and errors
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (req, { userId, user }) => {
 *   // Your protected logic here
 *   return NextResponse.json({ data: "protected data" });
 * });
 * ```
 */
export function withAuth<T extends any[]>(
  handler: (
    request: Request,
    context: { userId: string; user: any; session: any },
    ...args: T
  ) => Promise<any>
) {
  return async (request: Request, ...args: T): Promise<NextResponse> => {
    try {
      const authContext = await requireAuth();
      return await handler(request, authContext, ...args);
    } catch (error) {
      return handleAuthError(error);
    }
  };
}
