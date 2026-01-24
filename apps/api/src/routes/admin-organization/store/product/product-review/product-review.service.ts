import { and, eq } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/lib/db";
import { productReview } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";
import type {
	insertProductReviewSchema,
	updateProductReviewSchema,
} from "../schema";

type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
type UpdateProductReview = z.infer<typeof updateProductReviewSchema>;

/**
 * Create a new product review
 */
export async function createProductReview(
	productReviewData: InsertProductReview,
	orgId: string,
) {
	const [newProductReview] = await db
		.insert(productReview)
		.values({
			...productReviewData,
			organizationId: orgId,
		})
		.returning();
	return newProductReview;
}

/**
 * Get all product reviews for an organization
 */
export async function getProductReviews(orgId: string) {
	const foundProductReviews = await db
		.select()
		.from(productReview)
		.where(eq(productReview.organizationId, validateOrgId(orgId)));
	return foundProductReviews;
}

/**
 * Get a single product review by ID
 */
export async function getProductReview(productReviewId: string, orgId: string) {
	const [foundProductReview] = await db
		.select()
		.from(productReview)
		.where(
			and(
				eq(productReview.id, productReviewId),
				eq(productReview.organizationId, validateOrgId(orgId)),
			),
		)
		.limit(1);
	return foundProductReview;
}

/**
 * Update a product review
 */
export async function updateProductReview(
	productReviewId: string,
	productReviewData: UpdateProductReview,
	orgId: string,
) {
	const [updatedProductReview] = await db
		.update(productReview)
		.set(productReviewData)
		.where(
			and(
				eq(productReview.id, productReviewId),
				eq(productReview.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return updatedProductReview;
}

/**
 * Delete a product review
 */
export async function deleteProductReview(
	productReviewId: string,
	orgId: string,
) {
	const [deletedProductReview] = await db
		.delete(productReview)
		.where(
			and(
				eq(productReview.id, productReviewId),
				eq(productReview.organizationId, validateOrgId(orgId)),
			),
		)
		.returning();
	return deletedProductReview;
}
