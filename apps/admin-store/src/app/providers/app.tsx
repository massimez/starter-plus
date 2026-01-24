"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const queryClient = new QueryClient();

export function AppProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return (
		<QueryClientProvider client={queryClient}>
			<NextThemesProvider {...props}>{children}</NextThemesProvider>
		</QueryClientProvider>
	);
}
