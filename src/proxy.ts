import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy middleware
 * Now using Better Auth for authentication instead of beta tokens
 */
export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Skip proxy for:
	// 1. All auth endpoints (Better Auth handles authentication)
	// 2. Static files and Next.js internal routes
	// 3. Public assets
	if (
		pathname.startsWith("/api/auth/") || // Allow all Better Auth routes
		pathname.startsWith("/_next") ||
		pathname.startsWith("/static") ||
		pathname.match(
			/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/
		)
	) {
		return NextResponse.next();
	}

	// Optional: Add any additional route protection here
	// For now, we allow all routes and let individual API routes handle auth
	// using the requireAuth() or getUserId() helpers

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
