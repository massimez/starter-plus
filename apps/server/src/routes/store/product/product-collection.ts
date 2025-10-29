import { and, eq } from "drizzle-orm";
import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { productCollection } from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertProductCollectionSchema,
	updateProductCollectionSchema,
} from "./schema";

const getProductCollectionsQuerySchema = z.object({
	lang: z.string().length(2).optional(),
});

export const productCollectionRoute = createRouter()
	.post(
		"/product-collections",
		authMiddleware,
		hasOrgPermission("productCollection:create"),
		jsonValidator(insertProductCollectionSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newProductCollection] = await db
					.insert(productCollection)
					.values({ ...data, organizationId: activeOrgId })
					.returning();
				return c.json(newProductCollection, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product collection");
			}
		},
	)
	.get(
		"/product-collections",
		authMiddleware,
		hasOrgPermission("productCollection:read"),
		queryValidator(getProductCollectionsQuerySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const whereConditions = [
					eq(productCollection.organizationId, activeOrgId),
				];

				const foundProductCollections = await db
					.select()
					.from(productCollection)
					.where(and(...whereConditions));

				return c.json({ data: foundProductCollections });
			} catch (error) {
				return handleRouteError(c, error, "fetch product collections");
			}
		},
	)
	.get(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundProductCollection] = await db
					.select()
					.from(productCollection)
					.where(
						and(
							eq(productCollection.id, id),
							eq(productCollection.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProductCollection)
					return c.json({ error: "Product collection not found" }, 404);
				return c.json(foundProductCollection);
			} catch (error) {
				return handleRouteError(c, error, "fetch product collection");
			}
		},
	)
	.put(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductCollectionSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedProductCollection] = await db
					.update(productCollection)
					.set(data)
					.where(
						and(
							eq(productCollection.id, id),
							eq(productCollection.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProductCollection)
					return c.json({ error: "Product collection not found" }, 404);
				return c.json(updatedProductCollection);
			} catch (error) {
				return handleRouteError(c, error, "update product collection");
			}
		},
	)
	.delete(
		"/product-collections/:id",
		authMiddleware,
		hasOrgPermission("productCollection:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedProductCollection] = await db
					.delete(productCollection)
					.where(
						and(
							eq(productCollection.id, id),
							eq(productCollection.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProductCollection)
					return c.json({ error: "Product collection not found" }, 404);
				return c.json({
					message: "Product collection deleted successfully",
					deletedProductCollection,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product collection");
			}
		},
	);
