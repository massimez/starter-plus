import { z } from "zod";
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
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	awardPoints,
	cancelPendingPoints,
	confirmPendingPoints,
	getPointsBalance,
	getTransactionHistory,
} from "../points.service";
import { awardPointsManualSchema } from "../schema";

export const pointsAdminRoute = createRouter()
	/**
	 * POST /points/award
	 * Manually award points to a user (admin only)
	 */
	.post(
		"/points/award",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(awardPointsManualSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { userId, points, description, expiresAt } = c.req.valid("json");

				// Get the active bonus program for the organization
				// This would require importing getActiveBonusProgram
				// For now, we'll require bonusProgramId in the schema
				const bonusProgramId = c.req.query("bonusProgramId");

				if (!bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"bonusProgramId is required",
							[
								{
									code: "REQUIRED",
									path: ["bonusProgramId"],
									message: "bonusProgramId query parameter is required",
								},
							],
						),
						400,
					);
				}

				const transaction = await awardPoints({
					userId,
					organizationId,
					bonusProgramId,
					points,
					type: "earned_manual",
					description: description || "Manual points award by admin",
					status: "confirmed",
					expiresAt: expiresAt ? new Date(expiresAt) : undefined,
				});

				return c.json(
					createSuccessResponse(transaction, "Points awarded successfully"),
					201,
				);
			} catch (error) {
				return handleRouteError(c, error, "award points");
			}
		},
	)

	/**
	 * POST /points/deduct
	 * Manually deduct points from a user (admin only)
	 */
	.post(
		"/points/deduct",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(
			z.object({
				userId: z.string(),
				points: z.number().int().positive(),
				description: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { userId, points, description } = c.req.valid("json");

				const bonusProgramId = c.req.query("bonusProgramId");

				if (!bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"bonusProgramId is required",
							[
								{
									code: "REQUIRED",
									path: ["bonusProgramId"],
									message: "bonusProgramId query parameter is required",
								},
							],
						),
						400,
					);
				}

				// Import deductPoints from points.service
				const { deductPoints } = await import("../points.service");

				const transaction = await deductPoints(
					userId,
					organizationId,
					bonusProgramId,
					points,
					"deducted_manual",
					description || "Manual points deduction by admin",
				);

				return c.json(
					createSuccessResponse(transaction, "Points deducted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "deduct points");
			}
		},
	)

	/**
	 * POST /points/confirm/:transactionId
	 * Confirm pending points
	 */
	.post(
		"/points/confirm/:transactionId",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		paramValidator(
			idParamSchema.extend({ transactionId: idParamSchema.shape.id }),
		),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { transactionId } = c.req.valid("param");

				const transaction = await confirmPendingPoints(
					transactionId,
					organizationId,
				);

				return c.json(
					createSuccessResponse(transaction, "Points confirmed successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "confirm points");
			}
		},
	)

	/**
	 * POST /points/cancel/:transactionId
	 * Cancel pending points
	 */
	.post(
		"/points/cancel/:transactionId",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		paramValidator(
			idParamSchema.extend({ transactionId: idParamSchema.shape.id }),
		),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { transactionId } = c.req.valid("param");

				const transaction = await cancelPendingPoints(
					transactionId,
					organizationId,
				);

				return c.json(
					createSuccessResponse(transaction, "Points cancelled successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "cancel points");
			}
		},
	)

	/**
	 * GET /points/balance/:userId
	 * Get user's points balance with tier information
	 */
	.get(
		"/points/balance/:userId",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(
			z.object({
				userId: idParamSchema.shape.id,
			}),
		),
		queryValidator(
			z.object({
				bonusProgramId: z.string(),
			}),
		),
		async (c) => {
			try {
				const { userId } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const bonusProgramId = c.req.query("bonusProgramId");

				if (!bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"bonusProgramId is required",
							[
								{
									code: "REQUIRED",
									path: ["bonusProgramId"],
									message: "bonusProgramId query parameter is required",
								},
							],
						),
						400,
					);
				}

				const balance = await getPointsBalance(userId, bonusProgramId);

				// Verify the bonus program belongs to the current organization
				const { db } = await import("@/lib/db");
				const { bonusProgram } = await import("@/lib/db/schema");
				const { eq } = await import("drizzle-orm");

				const program = await db.query.bonusProgram.findFirst({
					where: eq(bonusProgram.id, bonusProgramId),
				});

				if (!program || program.organizationId !== organizationId) {
					return c.json(
						createErrorResponse(
							"ForbiddenError",
							"Access denied to this bonus program",
							[
								{
									code: "FORBIDDEN",
									path: ["bonusProgramId"],
									message:
										"You do not have access to this bonus program or it does not exist",
								},
							],
						),
						403,
					);
				}

				// Calculate tier information
				const { calculateUserTier } = await import("../tier.service");
				const tierInfo = await calculateUserTier(userId, bonusProgramId);

				return c.json(
					createSuccessResponse({
						...balance,
						nextTier: tierInfo?.nextTier
							? {
									name: tierInfo.nextTier.name,
									minPoints: tierInfo.nextTier.minPoints,
								}
							: null,
					}),
				);
			} catch (error) {
				return handleRouteError(c, error, "fetch points balance");
			}
		},
	)

	/**
	 * GET /points/history/:userId
	 * Get user's transaction history
	 */
	.get(
		"/points/history/:userId",
		authMiddleware,
		paramValidator(
			z.object({
				userId: idParamSchema.shape.id,
			}),
		),
		queryValidator(
			z.object({
				bonusProgramId: z.string(),
				limit: z.string().optional(),
				offset: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const sessionUserId = c.get("session")?.userId as string;

				const bonusProgramId = c.req.query("bonusProgramId");
				const limit = Number.parseInt(c.req.query("limit") || "20", 10);
				const offset = Number.parseInt(c.req.query("offset") || "0", 10);

				if (!bonusProgramId) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							"bonusProgramId is required",
							[
								{
									code: "REQUIRED",
									path: ["bonusProgramId"],
									message: "bonusProgramId query parameter is required",
								},
							],
						),
						400,
					);
				}

				const history = await getTransactionHistory(
					sessionUserId,
					bonusProgramId,
					limit,
					offset,
				);

				return c.json(createSuccessResponse(history));
			} catch (error) {
				return handleRouteError(c, error, "fetch transaction history");
			}
		},
	);
