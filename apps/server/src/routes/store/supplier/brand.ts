import { and, eq, isNull } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { idAndAuditFields } from "@/helpers/constant/fields";
import { withPaginationAndTotal } from "@/helpers/pagination";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { brand } from "@/lib/db/schema";
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
import { offsetPaginationSchema } from "@/middleware/pagination";

const app = createRouter();

export const insertBrandSchema = createInsertSchema(brand);
export const updateBrandSchema = createSelectSchema(brand)
	.omit(idAndAuditFields)
	.partial();

export const brandRoute = app
	.post(
		"/brands",
		authMiddleware,
		hasOrgPermission("brand:create"),
		jsonValidator(insertBrandSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newBrand] = await db
					.insert(brand)
					.values({
						...data,
						organizationId: activeOrgId,
					})
					.returning();
				return c.json(newBrand, 201);
			} catch (error) {
				return handleRouteError(c, error, "create brand");
			}
		},
	)
	.get(
		"/brands",
		authMiddleware,
		hasOrgPermission("brand:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { limit, offset, orderBy, direction } = c.req.valid("query");

				const { data: brandList, total } = await withPaginationAndTotal({
					db,
					query: db.select().from(brand),
					table: brand,
					params: { limit, offset, orderBy, direction },
					orgId: activeOrgId,
				});

				return c.json({ total, data: brandList });
			} catch (error) {
				return handleRouteError(c, error, "fetch brands");
			}
		},
	)
	.get(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundBrand] = await db
					.select()
					.from(brand)
					.where(
						and(
							eq(brand.id, id),
							eq(brand.organizationId, validateOrgId(activeOrgId)),
							isNull(brand.deletedAt),
						),
					)
					.limit(1);
				if (!foundBrand) return c.json({ error: "Brand not found" }, 404);
				return c.json(foundBrand);
			} catch (error) {
				return handleRouteError(c, error, "fetch brand");
			}
		},
	)
	.put(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateBrandSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedBrand] = await db
					.update(brand)
					.set(data)
					.where(
						and(
							eq(brand.id, id),
							eq(brand.organizationId, validateOrgId(activeOrgId)),
							isNull(brand.deletedAt),
						),
					)
					.returning();
				if (!updatedBrand) return c.json({ error: "Brand not found" }, 404);
				return c.json(updatedBrand);
			} catch (error) {
				return handleRouteError(c, error, "update brand");
			}
		},
	)
	.delete(
		"/brands/:id",
		authMiddleware,
		hasOrgPermission("brand:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedBrand] = await db
					.update(brand)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(brand.id, id),
							eq(brand.organizationId, validateOrgId(activeOrgId)),
							isNull(brand.deletedAt),
						),
					)
					.returning();
				if (!deletedBrand)
					return c.json({ error: "Brand not found or already deleted" }, 404);
				return c.json({
					message: "Brand deleted successfully",
					deletedBrand,
				});
			} catch (error) {
				return handleRouteError(c, error, "brand delete");
			}
		},
	);
