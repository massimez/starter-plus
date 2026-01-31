import "@workspace/ui/globals.css";

import {
	SidebarInset,
	SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { Toaster } from "@workspace/ui/components/sonner";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { CurrencyProvider } from "@/app/providers/currency-provider";
import QueryProvider from "@/app/providers/query";
import { ThemeProvider } from "@/app/providers/theme";
import { ModalProvider } from "@/components/modals/modal-context";
import ModalRenderer from "@/components/modals/modal-render";
import { OrganizationGuard } from "@/components/organization-guard";
import { AppSidebar } from "./layout/sidebar/app-sidebar";
import { HeaderDashboard } from "./layout/sidebar/header";

export const metadata: Metadata = {
	title: "ShopyKit Dashboard",
	description: "Manage your ShopyKit commerce platform",
};

interface LayoutProps {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}

export default async function MainLayout({ children, params }: LayoutProps) {
	// const isRTL = direction === 'rtl';

	const { locale } = await params;

	return (
		<html lang={locale} dir={"ltr"} suppressHydrationWarning>
			<body
				className={cn(
					"min-h-screen bg-linear-to-br from-background via-background to-muted/20",
					"rtl",
				)}
			>
				<NuqsAdapter>
					<QueryProvider>
						<ThemeProvider
							attribute="class"
							defaultTheme="system"
							enableSystem
							disableTransitionOnChange
						>
							<NextIntlClientProvider>
								<ModalProvider>
									<ModalRenderer />
									<Toaster position="top-center" richColors />
									<CurrencyProvider>
										<OrganizationGuard>
											<SidebarProvider>
												<AppSidebar />
												<SidebarInset>
													<HeaderDashboard />
													<div className="p-4">{children}</div>
												</SidebarInset>
											</SidebarProvider>
										</OrganizationGuard>
									</CurrencyProvider>
								</ModalProvider>
							</NextIntlClientProvider>
						</ThemeProvider>
					</QueryProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
