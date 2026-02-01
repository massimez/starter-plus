import { Card } from "@workspace/ui/components/card";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { storefrontClient } from "@/lib/storefront";
import { getTenantSlugServer } from "@/lib/tenant/get-tenant-server";

export default async function LayoutStore({
	children,
}: {
	children: React.ReactNode;
}) {
	const slug = await getTenantSlugServer();
	let logo: string | null = null;
	let storeName = "";
	let email: string | undefined;
	let phone: string | undefined;

	try {
		const org = await storefrontClient.getOrganization({ orgSlug: slug });
		logo = org.logo;
		storeName = org.name;
		email = org.info?.contactEmail || undefined;
		phone = org.info?.contactPhone || undefined;
	} catch (error) {
		console.warn("Failed to fetch organization info for layout:", error);
	}

	return (
		<div className="container mx-auto flex flex-col gap-2.5">
			<Navbar logo={logo} storeName={storeName} />
			<div className="flex min-h-[calc(100vh-5rem)] gap-2.5">
				<Card className="w-full flex-1 p-4">{children}</Card>
			</div>
			<Footer storeName={storeName} email={email} phone={phone} />
		</div>
	);
}
