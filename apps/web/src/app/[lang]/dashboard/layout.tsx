import "@workspace/ui/styles/globals.css";

import {
	SidebarInset,
	SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { Toaster } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import QueryProvider from "@/app/providers/query";
import { ThemeProvider } from "@/app/providers/theme";
import { ModalProvider } from "@/components/modals/modal-context";
import ModalRenderer from "@/components/modals/modal-render";
import { AppSidebar } from "./layout/sidebar/app-sidebar";
import { HeaderDashboard } from "./layout/sidebar/header";

export const metadata: Metadata = {
	title: "Next Starter Template",
	description: "A starter template for Next.js applications",
};

interface LayoutProps {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}

export default async function MainLayout({ children, params }: LayoutProps) {
	// const isRTL = direction === 'rtl';

	const { lang } = await params;

	return (
		<html lang={lang} dir={"ltr"} suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
					"rtl",
				)}
			>
				<QueryProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<ModalProvider>
							<ModalRenderer />
							<Toaster position="top-center" richColors />
							<SidebarProvider>
								<NextIntlClientProvider>
									<AppSidebar />
									<SidebarInset>
										<HeaderDashboard />
										<div className="p-4">{children}</div>
									</SidebarInset>
								</NextIntlClientProvider>
							</SidebarProvider>
						</ModalProvider>
					</ThemeProvider>
				</QueryProvider>
			</body>
		</html>
	);
}
