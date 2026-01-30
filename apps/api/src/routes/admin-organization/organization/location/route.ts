import z from "zod";
import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import { jsonValidator, paramValidator } from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createLocation,
	deleteLocation,
	getLocationById,
	getLocationsByOrg,
	updateLocation,
} from "./location.service";
import { insertLocationSchema, updateLocationSchema } from "./schema";

const idParamSchema = z.object({
	id: z.string().min(1, "id is required"),
});

// --------------------
// Routes
// --------------------
export const locationRoute = createRouter()
	.post(
		"/locations",
		hasOrgPermission("location:create"),
		jsonValidator(insertLocationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const data = c.req.valid("json");

				const newLocation = await createLocation(
					{
						...data,
						organizationId: activeOrgId,
					},
					user,
				);

				return c.json(newLocation, 201);
			} catch (error) {
				return handleRouteError(c, error, "create location");
			}
		},
	)

	.get("/locations", hasOrgPermission("location:read"), async (c) => {
		try {
			const activeOrgId = c.get("session")?.activeOrganizationId as string;
			const locations = await getLocationsByOrg(activeOrgId);
			return c.json({ data: locations });
		} catch (error) {
			return handleRouteError(c, error, "fetch locations");
		}
	})

	.get(
		"/locations/:id",
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
		hasOrgPermission("location:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateLocationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");

				const updatedLocation = await updateLocation(
					id,
					data,
					activeOrgId,
					user,
				);
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
		hasOrgPermission("location:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const user = c.get("user") as User;
				const { id } = c.req.valid("param");

				const deletedLocation = await deleteLocation(id, activeOrgId, user);
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
