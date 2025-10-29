import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import { insertLocationSchema, updateLocationSchema } from "@/lib/db/schema";
import { handleRouteError } from "@/lib/utils/route-helpers";
import { jsonValidator, paramValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createLocation,
	deleteLocation,
	getLocationById,
	getLocationsByOrg,
	updateLocation,
} from "./location.service";

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

				const newLocation = await createLocation({
					...data,
					organizationId: activeOrgId,
				});

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
				const locations = await getLocationsByOrg(activeOrgId);
				return c.json({ data: locations });
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

				const location = await getLocationById(id, activeOrgId);
				if (!location) return c.json({ error: "Location not found" }, 404);

				return c.json(location);
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

				const updatedLocation = await updateLocation(id, data, activeOrgId);
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

				const deletedLocation = await deleteLocation(id, activeOrgId);
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
