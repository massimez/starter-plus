import { and, eq, isNull } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import { productVariant } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type {
	insertProductVariantSchema,
	updateProductVariantSchema,
} from "../schema";

type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
type UpdateProductVariant = z.infer<typeof updateProductVariantSchema>;

/**
 * Create a new product variant
 */
export async function createProductVariant(
	productVariantData: InsertProductVariant,
	orgId: string,
) {
	const [newProductVariant] = await db
		.insert(productVariant)
		.values({
			...productVariantData,
			organizationId: orgId,
		})
		.returning();
	return newProductVariant;
}

/**
 * Get all product variants for an organization
 */
export async function getProductVariants(orgId: string) {
	const foundProductVariants = await db
		.select()
		.from(productVariant)
		.where(
			and(
				eq(productVariant.organizationId, validateOrgId(orgId)),
				isNull(productVariant.deletedAt),
			),
		);
	return foundProductVariants;
}

/**
 * Get a single product variant by ID
 */
export async function getProductVariant(
	productVariantId: string,
	orgId: string,
) {
	const [foundProductVariant] = await db
		.select()
		.from(productVariant)
		.where(
			and(
				eq(productVariant.id, productVariantId),
				eq(productVariant.organizationId, validateOrgId(orgId)),
				isNull(productVariant.deletedAt),
			),
		)
		.limit(1);
	return foundProductVariant;
}

/**
 * Update a product variant
 */
export async function updateProductVariant(
	productVariantId: string,
	productVariantData: UpdateProductVariant,
	orgId: string,
) {
	const [updatedProductVariant] = await db
		.update(productVariant)
		.set(productVariantData)
		.where(
			and(
				eq(productVariant.id, productVariantId),
				eq(productVariant.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return updatedProductVariant;
}

/**
 * Delete a product variant
 */
export async function deleteProductVariant(
	productVariantId: string,
	orgId: string,
) {
	const [deletedProductVariant] = await db
		.update(productVariant)
		.set({
			deletedAt: new Date(),
		})
		.where(
			and(
				eq(productVariant.id, productVariantId),
				eq(productVariant.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return deletedProductVariant;
}
