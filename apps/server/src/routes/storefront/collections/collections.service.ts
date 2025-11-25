import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCollection } from "@/lib/db/schema/store/product";

export async function getStorefrontCollections(params: {
	organizationId: string;
}) {
	const { organizationId } = params;

	const collections = await db
		.select()
		.from(productCollection)
		.where(
			and(
				eq(productCollection.organizationId, organizationId),
				eq(productCollection.isActive, true),
				eq(productCollection.isVisible, true),
			),
		);

	return collections;
}
