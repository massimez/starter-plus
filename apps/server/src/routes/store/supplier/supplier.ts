import { and, eq, isNull } from "drizzle-orm";

import { withPaginationAndTotal } from "@/helpers/pagination";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { supplier } from "@/lib/db/schema";
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
import { insertSupplierSchema, updateSupplierSchema } from "./schema";

export const supplierRoute = createRouter()
	.post(
		"/suppliers",
		authMiddleware,
		hasOrgPermission("supplier:create"),
		jsonValidator(insertSupplierSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const [newSupplier] = await db
					.insert(supplier)
					.values({
						...data,
						organizationId: activeOrgId,
					})
					.returning();
				return c.json(newSupplier, 201);
			} catch (error) {
				return handleRouteError(c, error, "create supplier");
			}
		},
	)
	.get(
		"/suppliers",
		authMiddleware,
		hasOrgPermission("supplier:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { limit, offset, orderBy, direction } = c.req.valid("query");

				const { data: suppliers, total } = await withPaginationAndTotal({
					db,
					query: db.select().from(supplier),
					table: supplier,
					params: { limit, offset, orderBy, direction },
					orgId: activeOrgId,
				});

				return c.json({ total, data: suppliers });
			} catch (error) {
				return handleRouteError(c, error, "fetch suppliers");
			}
		},
	)
	.get(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [foundSupplier] = await db
					.select()
					.from(supplier)
					.where(
						and(
							eq(supplier.id, id),
							eq(supplier.organizationId, validateOrgId(activeOrgId)),
							isNull(supplier.deletedAt),
						),
					)
					.limit(1);
				if (!foundSupplier) return c.json({ error: "Supplier not found" }, 404);
				return c.json(foundSupplier);
			} catch (error) {
				return handleRouteError(c, error, "fetch supplier");
			}
		},
	)
	.put(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateSupplierSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const [updatedSupplier] = await db
					.update(supplier)
					.set(data)
					.where(
						and(
							eq(supplier.id, id),
							eq(supplier.organizationId, validateOrgId(activeOrgId)),
							isNull(supplier.deletedAt),
						),
					)
					.returning();
				if (!updatedSupplier)
					return c.json({ error: "Supplier not found" }, 404);
				return c.json(updatedSupplier);
			} catch (error) {
				return handleRouteError(c, error, "update supplier");
			}
		},
	)
	.delete(
		"/suppliers/:id",
		authMiddleware,
		hasOrgPermission("supplier:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const [deletedSupplier] = await db
					.update(supplier)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(supplier.id, id),
							eq(supplier.organizationId, validateOrgId(activeOrgId)),
							isNull(supplier.deletedAt),
						),
					)
					.returning();
				if (!deletedSupplier)
					return c.json(
						{ error: "Supplier not found or already deleted" },
						404,
					);
				return c.json({
					message: "Supplier deleted successfully",
					deletedSupplier,
				});
			} catch (error) {
				return handleRouteError(c, error, "supplier delete");
			}
		},
	);
