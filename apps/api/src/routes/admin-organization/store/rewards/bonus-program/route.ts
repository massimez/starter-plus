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
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	createBonusProgram,
	deleteBonusProgram,
	getBonusProgram,
	getBonusProgramStats,
	listBonusPrograms,
	updateBonusProgram,
} from "../bonus-program.service";
import { createBonusProgramSchema, updateBonusProgramSchema } from "../schema";

export const bonusProgramRoute = createRouter()
	/**
	 * POST /bonus-programs
	 * Create a new bonus program
	 */
	.post(
		"/bonus-programs",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(createBonusProgramSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const payload = c.req.valid("json");

				const program = await createBonusProgram({
					...payload,
					organizationId,
				});

				return c.json(
					createSuccessResponse(program, "Bonus program created successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "create bonus program");
			}
		},
	)

	/**
	 * GET /bonus-programs
	 * List all bonus programs
	 */
	.get(
		"/bonus-programs",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const programs = await listBonusPrograms(organizationId);

				return c.json(createSuccessResponse({ programs }));
			} catch (error) {
				return handleRouteError(c, error, "fetch bonus programs");
			}
		},
	)

	/**
	 * GET /bonus-programs/:id
	 * Get a specific bonus program
	 */
	.get(
		"/bonus-programs/:id",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const program = await getBonusProgram(id, organizationId);

				if (!program) {
					return c.json(
						createErrorResponse("NotFoundError", "Bonus program not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No bonus program found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(program));
			} catch (error) {
				return handleRouteError(c, error, "fetch bonus program");
			}
		},
	)

	/**
	 * PATCH /bonus-programs/:id
	 * Update a bonus program
	 */
	.patch(
		"/bonus-programs/:id",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		paramValidator(idParamSchema),
		jsonValidator(updateBonusProgramSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const payload = c.req.valid("json");

				const updated = await updateBonusProgram(id, organizationId, payload);

				if (!updated) {
					return c.json(
						createErrorResponse("NotFoundError", "Bonus program not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No bonus program found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(updated, "Bonus program updated successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "update bonus program");
			}
		},
	)

	/**
	 * DELETE /bonus-programs/:id
	 * Delete a bonus program
	 */
	.delete(
		"/bonus-programs/:id",
		authMiddleware,
		hasOrgPermission("rewards:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const deleted = await deleteBonusProgram(id, organizationId);

				if (!deleted) {
					return c.json(
						createErrorResponse("NotFoundError", "Bonus program not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["id"],
								message: "No bonus program found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(deleted, "Bonus program deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete bonus program");
			}
		},
	)

	/**
	 * GET /bonus-programs/:id/stats
	 * Get bonus program statistics
	 */
	.get(
		"/bonus-programs/:id/stats",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const stats = await getBonusProgramStats(id, organizationId);

				return c.json(createSuccessResponse(stats));
			} catch (error) {
				return handleRouteError(c, error, "fetch bonus program stats");
			}
		},
	);
