import type { User } from "@/lib/auth";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createMilestone,
	deleteMilestone,
	listMilestones,
	updateMilestone,
} from "../milestone.service";
import { createMilestoneSchema, updateMilestoneSchema } from "../schema";

export const milestoneRoute = createRouter()
	/**
	 * POST /milestones
	 * Create a new milestone
	 */
	.post(
		"/milestones",
		hasOrgPermission("rewards:write"),
		jsonValidator(createMilestoneSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const payload = c.req.valid("json");

				const milestone = await createMilestone(
					{
						...payload,
						organizationId,
					},
					user,
				);

				return c.json(
					createSuccessResponse(milestone, "Milestone created successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "create milestone");
			}
		},
	)

	/**
	 * GET /milestones
	 * List all milestones for a program
	 */
	.get("/milestones", hasOrgPermission("rewards:read"), async (c) => {
		try {
			const bonusProgramId = c.req.query("bonusProgramId");

			if (!bonusProgramId) {
				return c.json(
					createErrorResponse("ValidationError", "bonusProgramId is required", [
						{
							code: "REQUIRED",
							path: ["bonusProgramId"],
							message: "bonusProgramId query parameter is required",
						},
					]),
					400,
				);
			}

			const milestones = await listMilestones(bonusProgramId);

			return c.json(createSuccessResponse({ milestones }));
		} catch (error) {
			return handleRouteError(c, error, "fetch milestones");
		}
	})

	/**
	 * PATCH /milestones/:id
	 * Update a milestone
	 */
	.patch(
		"/milestones/:id",
		hasOrgPermission("rewards:write"),
		paramValidator(idParamSchema),
		jsonValidator(updateMilestoneSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;
				const payload = c.req.valid("json");

				const updated = await updateMilestone(
					id,
					organizationId,
					payload,
					user,
				);

				if (!updated) {
					return c.json(
						createErrorResponse("NotFoundError", "Milestone not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No milestone found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(updated, "Milestone updated successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "update milestone");
			}
		},
	)

	/**
	 * DELETE /milestones/:id
	 * Delete a milestone
	 */
	.delete(
		"/milestones/:id",
		hasOrgPermission("rewards:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as User;

				const deleted = await deleteMilestone(id, organizationId, user);

				if (!deleted) {
					return c.json(
						createErrorResponse("NotFoundError", "Milestone not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No milestone found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(deleted, "Milestone deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete milestone");
			}
		},
	);
