import "@workspace/ui/globals.css";

import { Toaster } from "@workspace/ui/components//sonner";
import { cn } from "@workspace/ui/lib/utils";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { FooterMain } from "@/app/[locale]/(landing)/layout/footer";
import { HeaderMain } from "@/app/[locale]/(landing)/layout/header";
import { ThemeProvider } from "@/app/providers/theme";
import { ModalProvider } from "@/components/modals/modal-context";
import ModalRenderer from "@/components/modals/modal-render";

export const metadata: Metadata = {
	title: "Next Starter Template",
	description: "A starter template for Next.js applications",
};

interface LayoutProps {
	children: React.ReactNode;
	// direction?: "ltr" | "rtl";
	params: Promise<{ locale: string }>;
}

export default async function DashBoardLayout({
	children,
	// direction = "ltr",
	params,
}: LayoutProps) {
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
				<NextIntlClientProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<ModalProvider>
							<ModalRenderer />
							<Toaster position="top-center" richColors />
							<HeaderMain />
							<main className="flex-1">{children}</main>
							<FooterMain />
						</ModalProvider>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
