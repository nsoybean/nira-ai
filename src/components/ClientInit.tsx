"use client";

import { useEffect } from "react";
import { initializeFetchInterceptor } from "@/lib/fetch-interceptor";

/**
 * ClientInit component
 * Initializes client-side features that need to run once on app load
 */
export function ClientInit() {
	useEffect(() => {
		// Initialize the fetch interceptor to add beta token to all requests
		initializeFetchInterceptor();
	}, []);

	return null;
}
