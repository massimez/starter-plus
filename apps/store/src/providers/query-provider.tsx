"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// This code is only for TypeScript
declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__: QueryClient;
	}
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());

	// This code is for all users
	if (typeof window !== "undefined") {
		window.__TANSTACK_QUERY_CLIENT__ = queryClient;
	}

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
