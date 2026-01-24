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
	validateOrgId,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { cancelCoupon, getUserCoupons } from "../coupon.service";
import { cancelCouponSchema } from "../schema";

export const couponRoute = createRouter()

	/**
	 * POST /coupons/cancel
	 * Cancel a coupon (admin endpoint)
	 */
	.post(
		"/coupons/cancel",
		authMiddleware,
		hasOrgPermission("rewards:write"),
		jsonValidator(cancelCouponSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { couponId } = c.req.valid("json");

				const result = await cancelCoupon(couponId, organizationId);

				if (!result) {
					return c.json(
						createErrorResponse("NotFoundError", "Coupon not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["couponId"],
								message: "No coupon found with the provided id",
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(result, "Coupon cancelled successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "cancel coupon");
			}
		},
	)

	/**
	 * GET /coupons/user/:userId
	 * Get all coupons for a user
	 */
	.get(
		"/coupons/user/:userId",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(z.object({ userId: idParamSchema.shape.id })),
		async (c) => {
			try {
				const { userId } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

				const coupons = await getUserCoupons(userId, organizationId);

				return c.json(createSuccessResponse({ coupons }));
			} catch (error) {
				return handleRouteError(c, error, "fetch user coupons");
			}
		},
	)

	/**
	 * GET /coupons/:id
	 * Get coupon details
	 */
	.get(
		"/coupons/:id",
		authMiddleware,
		hasOrgPermission("rewards:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				// const { id } = c.req.valid("param");
				// const organizationId = validateOrgId(
				// 	c.get("session")?.activeOrganizationId as string,
				// );

				// This would require a new service function getCouponById
				// For now, we'll return a placeholder response
				return c.json(
					createErrorResponse(
						"NotImplementedError",
						"Get coupon by ID not yet implemented",
						[
							{
								code: "NOT_IMPLEMENTED",
								path: ["id"],
								message: "This endpoint is not yet implemented",
							},
						],
					),
					501,
				);
			} catch (error) {
				return handleRouteError(c, error, "fetch coupon");
			}
		},
	);
