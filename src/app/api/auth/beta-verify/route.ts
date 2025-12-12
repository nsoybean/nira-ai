import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/beta-verify
 *
 * Verifies the beta access password and returns a token
 *
 * Request body:
 * - password: string - The beta password to verify
 *
 * Response:
 * - token: string - The beta auth token (same as password for now)
 */
export async function POST(req: NextRequest) {
	try {
		const { password } = await req.json();

		if (!password) {
			return NextResponse.json(
				{ error: "Password is required" },
				{ status: 400 }
			);
		}

		// Get the beta auth token from environment
		const betaAuthToken = process.env.BETA_AUTH_TOKEN;

		if (!betaAuthToken) {
			console.error("BETA_AUTH_TOKEN environment variable is not set");
			return NextResponse.json(
				{ error: "Beta authentication is not configured" },
				{ status: 500 }
			);
		}

		// Verify the password matches the token
		if (password === betaAuthToken) {
			return NextResponse.json({
				token: password,
				message: "Authentication successful",
			});
		}

		// Invalid password
		return NextResponse.json({ error: "Invalid password" }, { status: 401 });
	} catch (error) {
		console.error("[Beta Auth] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
