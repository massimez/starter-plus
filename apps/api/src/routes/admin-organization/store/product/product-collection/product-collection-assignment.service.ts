import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { productCollectionAssignment } from "@/lib/db/schema";
import { validateOrgId } from "@/lib/utils/validator";

/**
 * Assign a product to multiple collections
 */
export async function assignProductToCollections(
	productId: string,
	collectionIds: string[],
	orgId: string,
) {
	if (!collectionIds || collectionIds.length === 0) {
		return [];
	}

	const validatedOrgId = validateOrgId(orgId);

	// Create assignments for each collection
	const assignments = collectionIds.map((collectionId) => ({
		productId,
		collectionId,
		organizationId: validatedOrgId,
	}));

	const newAssignments = await db
		.insert(productCollectionAssignment)
		.values(assignments)
		.returning();

	return newAssignments;
}

/**
 * Remove a product from specific collections
 */
export async function removeProductFromCollections(
	productId: string,
	collectionIds: string[],
	orgId: string,
) {
	if (!collectionIds || collectionIds.length === 0) {
		return [];
	}

	const validatedOrgId = validateOrgId(orgId);

	const deletedAssignments = await db
		.delete(productCollectionAssignment)
		.where(
			and(
				eq(productCollectionAssignment.productId, productId),
				inArray(productCollectionAssignment.collectionId, collectionIds),
				eq(productCollectionAssignment.organizationId, validatedOrgId),
			),
		)
		.returning();

	return deletedAssignments;
}

/**
 * Update product collections - replaces all existing assignments
 */
export async function updateProductCollections(
	productId: string,
	collectionIds: string[],
	orgId: string,
) {
	const validatedOrgId = validateOrgId(orgId);

	// First, remove all existing assignments for this product
	await db
		.delete(productCollectionAssignment)
		.where(
			and(
				eq(productCollectionAssignment.productId, productId),
				eq(productCollectionAssignment.organizationId, validatedOrgId),
			),
		);

	// Then, add the new assignments
	if (collectionIds && collectionIds.length > 0) {
		return await assignProductToCollections(productId, collectionIds, orgId);
	}

	return [];
}

/**
 * Get all collections for a product
 */
export async function getProductCollections(productId: string, orgId: string) {
	const validatedOrgId = validateOrgId(orgId);

	const assignments = await db
		.select()
		.from(productCollectionAssignment)
		.where(
			and(
				eq(productCollectionAssignment.productId, productId),
				eq(productCollectionAssignment.organizationId, validatedOrgId),
			),
		);

	return assignments;
}

/**
 * Get all products in a collection
 */
export async function getCollectionProducts(
	collectionId: string,
	orgId: string,
) {
	const validatedOrgId = validateOrgId(orgId);

	const assignments = await db
		.select()
		.from(productCollectionAssignment)
		.where(
			and(
				eq(productCollectionAssignment.collectionId, collectionId),
				eq(productCollectionAssignment.organizationId, validatedOrgId),
			),
		);

	return assignments;
}
