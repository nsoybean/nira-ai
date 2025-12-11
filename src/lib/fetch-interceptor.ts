/**
 * Fetch interceptor to automatically inject beta auth token into requests
 * This wraps the native fetch function to add authentication headers
 */

const STORAGE_KEY = "beta_auth_token";

// Store the original fetch (only in browser)
let originalFetch: typeof fetch | null = null;

/**
 * Initialize the fetch interceptor
 * This should be called once during app initialization
 */
export function initializeFetchInterceptor() {
	// Only run in browser environment
	if (typeof window === "undefined") {
		return;
	}

	// Store the original fetch on first initialization
	if (!originalFetch) {
		originalFetch = window.fetch;
	}

	// Override the global fetch function
	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		// Get the token from localStorage
		const token = localStorage.getItem(STORAGE_KEY);

		// If token exists, add it to headers
		if (token) {
			const headers = new Headers(init?.headers || {});
			headers.set("X-Beta-Token", token);

			init = {
				...init,
				headers,
			};
		}

		// Call the original fetch with modified headers
		return originalFetch!(input, init);
	};
}

/**
 * Restore the original fetch function (for cleanup if needed)
 */
export function restoreFetch() {
	if (typeof window !== "undefined" && originalFetch) {
		window.fetch = originalFetch;
	}
}
