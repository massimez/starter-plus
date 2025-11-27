import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@workspace/ui/globals.css";

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!routing.locales.includes(locale as "en" | "fr" | "ar")) {
		notFound();
	}

	const messages = await getMessages();

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			suppressHydrationWarning
		>
			<body>
				<NextIntlClientProvider messages={messages}>
					<NuqsAdapter>
						<QueryProvider>
							<ThemeProvider
								attribute="class"
								defaultTheme="system"
								enableSystem
								disableTransitionOnChange
							>
								<Navbar />
								{children}
								<Footer />
								<Toaster />
							</ThemeProvider>
						</QueryProvider>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
