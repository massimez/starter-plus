import { parseTenantSlug } from "@/lib/tenant/parse-tenant-slug";

export function getTenantSlug(): string | null | undefined {
	if (typeof window === "undefined") return null;

	const hostname = window.location.hostname;
	const slug = parseTenantSlug(hostname);

	if (slug === undefined) return null;
	return slug;
}
