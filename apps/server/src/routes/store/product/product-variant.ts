// --------------------
// Product Variant Routes

import { and, eq } from "drizzle-orm";
import type z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { productVariant } from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertProductVariantSchema,
	updateProductVariantSchema,
} from "./schema";

// --------------------
export const productVariantRoute = createRouter()
	.post(
		"/product-variants",
		authMiddleware,
		hasOrgPermission("productVariant:create"),
		jsonValidator(insertProductVariantSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newProductVariant] = await db
					.insert(productVariant)
					.values({
						...data,
						organizationId: activeOrgId,
					} as z.infer<typeof insertProductVariantSchema>)
					.returning();
				return c.json(newProductVariant, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product variant");
			}
		},
	)
	.get(
		"/product-variants",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const foundProductVariants = await db
					.select()
					.from(productVariant)
					.where(eq(productVariant.organizationId, activeOrgId));
				return c.json({ data: foundProductVariants });
			} catch (error) {
				return handleRouteError(c, error, "fetch product variants");
			}
		},
	)
	.get(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundProductVariant] = await db
					.select()
					.from(productVariant)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);
				if (!foundProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json(foundProductVariant);
			} catch (error) {
				return handleRouteError(c, error, "fetch product variant");
			}
		},
	)
	.put(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductVariantSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedProductVariant] = await db
					.update(productVariant)
					.set(data)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!updatedProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json(updatedProductVariant);
			} catch (error) {
				return handleRouteError(c, error, "update product variant");
			}
		},
	)
	.delete(
		"/product-variants/:id",
		authMiddleware,
		hasOrgPermission("productVariant:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedProductVariant] = await db
					.delete(productVariant)
					.where(
						and(
							eq(productVariant.id, id),
							eq(productVariant.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();
				if (!deletedProductVariant)
					return c.json({ error: "Product variant not found" }, 404);
				return c.json({
					message: "Product variant deleted successfully",
					deletedProductVariant,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product variant");
			}
		},
	);
