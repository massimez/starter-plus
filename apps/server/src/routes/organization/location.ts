import { and, eq } from "drizzle-orm";
import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import {
	insertLocationSchema,
	location,
	updateLocationSchema,
} from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";

const idParamSchema = z.object({
	id: z.string().min(1, "id is required"),
});

// --------------------
// Routes
// --------------------
export const locationRoute = createRouter()
	.post(
		"/locations",
		authMiddleware,
		hasOrgPermission("location:create"),
		jsonValidator(insertLocationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const data = c.req.valid("json");
				data.organizationId = activeOrgId;
				// force orgId on insert
				const [newLocation] = await db
					.insert(location)
					.values({ ...data, organizationId: activeOrgId })
					.returning();

				return c.json(newLocation, 201);
			} catch (error) {
				return handleRouteError(c, error, "create location");
			}
		},
	)

	.get(
		"/locations",
		authMiddleware,
		hasOrgPermission("location:read"),

		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const foundLocations = await db
					.select()
					.from(location)
					.where(eq(location.organizationId, activeOrgId));

				return c.json({ data: foundLocations });
			} catch (error) {
				return handleRouteError(c, error, "fetch locations");
			}
		},
	)

	.get(
		"/locations/:id",
		authMiddleware,

		hasOrgPermission("location:read"),
		paramValidator(idParamSchema),

		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const { id } = c.req.valid("param");

				const [foundLocation] = await db
					.select()
					.from(location)
					.where(
						and(
							eq(location.id, id),
							eq(location.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.limit(1);

				if (!foundLocation) return c.json({ error: "Location not found" }, 404);

				return c.json(foundLocation);
			} catch (error) {
				return handleRouteError(c, error, "fetch location");
			}
		},
	)

	.put(
		"/locations/:id",
		authMiddleware,

		hasOrgPermission("location:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateLocationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				data.organizationId = activeOrgId;
				const [updatedLocation] = await db
					.update(location)
					.set(data)
					.where(
						and(
							eq(location.id, id),
							eq(location.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();

				if (!updatedLocation)
					return c.json({ error: "Location not found" }, 404);

				return c.json(updatedLocation);
			} catch (error) {
				return handleRouteError(c, error, "update location");
			}
		},
	)

	.delete(
		"/locations/:id",
		authMiddleware,

		hasOrgPermission("location:delete"),
		paramValidator(idParamSchema),

		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;

				const { id } = c.req.valid("param");

				const [deletedLocation] = await db
					.delete(location)
					.where(
						and(
							eq(location.id, id),
							eq(location.organizationId, validateOrgId(activeOrgId)),
						),
					)
					.returning();

				if (!deletedLocation)
					return c.json({ error: "Location not found" }, 404);

				return c.json({
					message: "Location deleted successfully",
					deletedLocation,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete location");
			}
		},
	);
