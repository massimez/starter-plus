import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@workspace/ui/globals.css";
import type { Metadata } from "next";
import { storefrontClient } from "@/lib/storefront";
import { getTenantSlugServer } from "@/lib/tenant/get-tenant-server";

// Types<
type SeoMetadata = Record<
	string,
	{ title?: string; description?: string; keywords?: string }
>;

type LocaleParams = { locale: string };

// Type for the organization response - make it flexible
type OrganizationInfo = {
	seoMetadata?: SeoMetadata | null;
	[key: string]: unknown;
};

type Organization = {
	name: string;
	logo?: string | null;
	info?: OrganizationInfo | null;
	[key: string]: unknown;
};

// Constants
const DEFAULT_ORG_NAME = "Shop";
const DEFAULT_DESCRIPTION = "Premium E-commerce Experience";
const DEFAULT_DISCOVER_TEXT = "Discover the best products.";

/**
 * Builds metadata from organization SEO data
 */
function buildMetadataFromOrg(org: Organization, locale: string): Metadata {
	const seoMetadata = org.info?.seoMetadata;
	const localeSeo = seoMetadata?.[locale];

	const title = localeSeo?.title || `${org.name} - ${DEFAULT_DESCRIPTION}`;
	const description = localeSeo?.description || DEFAULT_DISCOVER_TEXT;
	const keywords = localeSeo?.keywords
		? localeSeo.keywords.split(",").map((k) => k.trim())
		: [];

	return {
		title: {
			template: `%s | ${org.name}`,
			default: title,
		},
		description,
		...(keywords.length > 0 && { keywords }),
		openGraph: {
			title: localeSeo?.title || org.name,
			description: localeSeo?.description || description,
			...(org.logo && {
				images: [
					{
						url: org.logo,
						alt: org.name,
					},
				],
			}),
		},
		...(org.logo && {
			icons: {
				icon: org.logo,
				shortcut: org.logo,
				apple: org.logo,
			},
		}),
	};
}

/**
 * Builds fallback metadata when organization fetch fails
 */
function buildFallbackMetadata(): Metadata {
	return {
		title: DEFAULT_ORG_NAME,
		description: DEFAULT_DESCRIPTION,
	};
}

// Metadata Generation
export async function generateMetadata({
	params,
}: {
	params: Promise<LocaleParams>;
}): Promise<Metadata> {
	const { locale } = await params;
	const slug = await getTenantSlugServer();

	try {
		const org = await storefrontClient.getOrganization({ orgSlug: slug });
		return buildMetadataFromOrg(org, locale);
	} catch (error) {
		console.warn(
			"Failed to fetch organization for metadata, using defaults.",
			error,
		);
		return buildFallbackMetadata();
	}
}

// Layout Component
export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<LocaleParams>;
}) {
	const { locale } = await params;

	// Validate locale
	if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
		notFound();
	}

	const messages = await getMessages();
	const isRtl = locale === "ar";

	return (
		<html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
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
								{children}
								<Toaster />
							</ThemeProvider>
						</QueryProvider>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
