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
	getReferralStats,
	getReferralsByProgram,
	trackReferral,
	validateReferralCode,
} from "../referral.service";
import { validateReferralCodeSchema } from "../schema";

export const referralRoute = createRouter()
	/**
	 * POST /referrals/validate
	 * Validate a referral code
	 */
	.post(
		"/referrals/validate",
		authMiddleware,
		jsonValidator(validateReferralCodeSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { code } = c.req.valid("json");

				const referral = await validateReferralCode(code, organizationId);

				if (!referral || !referral.isActive) {
					return c.json(
						createErrorResponse(
							"NotFoundError",
							"Invalid or inactive referral code",
							[
								{
									code: "INVALID_REFERRAL_CODE",
									path: ["code"],
									message: "The referral code is invalid or no longer active",
								},
							],
						),
						404,
					);
				}

				return c.json(
					createSuccessResponse(
						{
							valid: true,
							referrerId: referral.referrerId,
							bonusProgramId: referral.bonusProgramId,
						},
						"Referral code is valid",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "validate referral code");
			}
		},
	)

	/**
	 * GET /referrals/stats/:userId
	 * Get referral statistics for a user
	 */
	.get(
		"/referrals/stats/:userId",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(z.object({ userId: idParamSchema.shape.id })),
		queryValidator(z.object({ bonusProgramId: z.string() })),
		async (c) => {
			try {
				const { userId } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { bonusProgramId } = c.req.valid("query");

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

				const stats = await getReferralStats(
					userId,
					bonusProgramId,
					organizationId,
				);

				return c.json(createSuccessResponse(stats));
			} catch (error) {
				return handleRouteError(c, error, "fetch referral stats");
			}
		},
	)

	/**
	 * GET /referrals/program/:programId
	 * Get all referrals for a bonus program (admin)
	 */
	.get(
		"/referrals/program/:programId",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(z.object({ programId: z.string().uuid() })),
		async (c) => {
			try {
				const { programId } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				// Verify the bonus program belongs to the current organization
				const { db } = await import("@/lib/db");
				const { bonusProgram } = await import("@/lib/db/schema");
				const { eq } = await import("drizzle-orm");

				const program = await db.query.bonusProgram.findFirst({
					where: eq(bonusProgram.id, programId),
				});

				if (!program || program.organizationId !== organizationId) {
					return c.json(
						createErrorResponse(
							"ForbiddenError",
							"Access denied to this bonus program",
							[
								{
									code: "FORBIDDEN",
									path: ["programId"],
									message:
										"You do not have access to this bonus program or it does not exist",
								},
							],
						),
						403,
					);
				}

				const data = await getReferralsByProgram(programId, organizationId);

				return c.json(createSuccessResponse(data));
			} catch (error) {
				return handleRouteError(c, error, "fetch program referrals");
			}
		},
	)

	/**
	 * POST /referrals/track
	 * Track a referral signup (admin endpoint)
	 */

	.post(
		"/referrals/track",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(
			validateReferralCodeSchema.extend({
				referredUserId: validateReferralCodeSchema.shape.code,
			}),
		),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { code, referredUserId } = c.req.valid("json");

				const result = await trackReferral(
					code,
					referredUserId,
					organizationId,
				);

				if (!result) {
					return c.json(
						createErrorResponse("ValidationError", "Failed to track referral", [
							{
								code: "REFERRAL_TRACKING_FAILED",
								path: ["code"],
								message:
									"Unable to track referral. Code may be invalid or already used.",
							},
						]),
						400,
					);
				}

				return c.json(
					createSuccessResponse(result, "Referral tracked successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "track referral");
			}
		},
	);
