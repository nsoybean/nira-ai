import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy to validate beta authentication token
 * Protects API routes by checking for X-Beta-Token header
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for:
  // 1. Beta verification endpoint (needs to accept requests without token)
  // 2. Static files and Next.js internal routes
  // 3. Public assets
  if (
    pathname.startsWith("/api/auth/beta-verify") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.match(
      /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/
    )
  ) {
    return NextResponse.next();
  }

  // Only validate API routes
  if (pathname.startsWith("/api/")) {
    const betaToken = request.headers.get("X-Beta-Token");
    const expectedToken = process.env.BETA_AUTH_TOKEN;

    // If BETA_AUTH_TOKEN is not set, allow all requests (no beta protection)
    if (!expectedToken) {
      return NextResponse.next();
    }

    // Validate the token
    if (!betaToken || betaToken !== expectedToken) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Valid beta authentication token is required",
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
