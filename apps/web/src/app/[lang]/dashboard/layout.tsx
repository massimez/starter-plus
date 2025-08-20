import "./../../globals.css";

import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";

import { ModalProvider } from "@/components/modals/modal-context";
import ModalRenderer from "@/components/modals/modal-render";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./layout/sidebar/app-sidebar";

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
		<html lang={lang} dir={"ltr"}>
			<body
				className={cn(
					"min-h-screen bg-gradient-to-br from-background via-background to-muted/20",
					"rtl",
				)}
			>
				<ModalProvider>
					<ModalRenderer />
					<Toaster position="top-center" richColors />
					<SidebarProvider>
						<NextIntlClientProvider>
							<AppSidebar />

							<main className="flex-1">
								<SidebarTrigger />
								{children}
							</main>
						</NextIntlClientProvider>
					</SidebarProvider>
				</ModalProvider>
			</body>
		</html>
	);
}
