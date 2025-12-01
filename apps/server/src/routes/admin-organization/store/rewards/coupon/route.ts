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
	applyCoupon,
	cancelCoupon,
	getUserCoupons,
	validateCoupon,
} from "../coupon.service";
import { applyCouponSchema, cancelCouponSchema } from "../schema";

export const couponRoute = createRouter()
	/**
	 * POST /coupons/validate
	 * Validate a coupon code
	 */
	.post(
		"/coupons/validate",
		authMiddleware,
		jsonValidator(applyCouponSchema),
		async (c) => {
			try {
				const userId = c.get("session")?.user?.id;
				if (!userId) {
					return c.json(
						createErrorResponse("UnauthorizedError", "User not authenticated", [
							{
								code: "UNAUTHORIZED",
								path: ["userId"],
								message: "User must be authenticated",
							},
						]),
						401,
					);
				}

				const { code, orderTotal } = c.req.valid("json");

				const result = await validateCoupon(code, userId, orderTotal);

				if (!result.valid) {
					return c.json(
						createErrorResponse(
							"ValidationError",
							result.reason || "Invalid coupon",
							[
								{
									code: "INVALID_COUPON",
									path: ["code"],
									message: result.reason || "The coupon code is invalid",
								},
							],
						),
						400,
					);
				}

				return c.json(
					createSuccessResponse(
						{
							valid: true,
							coupon: result.coupon,
							discountAmount: result.discountAmount,
						},
						"Coupon is valid",
					),
				);
			} catch (error) {
				return handleRouteError(c, error, "validate coupon");
			}
		},
	)

	/**
	 * POST /coupons/apply
	 * Apply a coupon to an order
	 */
	.post(
		"/coupons/apply",
		authMiddleware,
		jsonValidator(applyCouponSchema),
		async (c) => {
			try {
				const userId = c.get("session")?.user?.id;
				if (!userId) {
					return c.json(
						createErrorResponse("UnauthorizedError", "User not authenticated", [
							{
								code: "UNAUTHORIZED",
								path: ["userId"],
								message: "User must be authenticated",
							},
						]),
						401,
					);
				}

				const { code, orderTotal } = c.req.valid("json");

				const result = await applyCoupon(code, userId, orderTotal);

				if (!result) {
					return c.json(
						createErrorResponse("ValidationError", "Failed to apply coupon", [
							{
								code: "COUPON_APPLICATION_FAILED",
								path: ["code"],
								message:
									"Unable to apply coupon. It may be invalid or expired.",
							},
						]),
						400,
					);
				}

				return c.json(
					createSuccessResponse(result, "Coupon applied successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "apply coupon");
			}
		},
	)

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
		paramValidator(idParamSchema.extend({ userId: idParamSchema.shape.id })),
		async (c) => {
			try {
				const { userId } = c.req.valid("param");
				const sessionUserId = c.get("session")?.user?.id;

				// Users can only view their own coupons unless they have admin permission
				if (userId !== sessionUserId) {
					const hasPermission = c
						.get("session")
						?.permissions?.includes("rewards:read");
					if (!hasPermission) {
						return c.json(
							createErrorResponse("ForbiddenError", "Access denied", [
								{
									code: "FORBIDDEN",
									path: ["userId"],
									message: "You can only view your own coupons",
								},
							]),
							403,
						);
					}
				}

				const coupons = await getUserCoupons(userId);

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
				const { id } = c.req.valid("param");
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);

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
