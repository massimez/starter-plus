import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	queryValidator,
	validateOrgId,
} from "@/lib/utils/validator";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	approvePayoutRequest,
	listPayoutRequests,
	markPayoutPaid,
	rejectPayoutRequest,
} from "./service";

const paginationSchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional().default(20),
	offset: z.coerce.number().int().min(0).optional().default(0),
	status: z.enum(["pending", "approved", "rejected", "paid"]).optional(),
});

const rejectSchema = z.object({
	reason: z.string().min(1),
});

export const payoutRoute = createRouter()
	.get(
		"/payouts",
		hasOrgPermission("payout:read"),
		queryValidator(paginationSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const { limit, offset, status } = c.req.valid("query");

				const result = await listPayoutRequests(
					organizationId,
					limit,
					offset,
					status,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "list payout requests");
			}
		},
	)
	.post(
		"/payouts/:id/approve",
		hasOrgPermission("payout:approve"),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as { id: string };
				const payoutId = c.req.param("id");

				const result = await approvePayoutRequest(
					payoutId,
					organizationId,
					user.id,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "approve payout request");
			}
		},
	)
	.post(
		"/payouts/:id/reject",
		hasOrgPermission("payout:reject"),
		jsonValidator(rejectSchema),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as { id: string };
				const payoutId = c.req.param("id");
				const { reason } = c.req.valid("json");

				const result = await rejectPayoutRequest(
					payoutId,
					organizationId,
					user.id,
					reason,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "reject payout request");
			}
		},
	)
	.post(
		"/payouts/:id/mark-paid",
		hasOrgPermission("payout:mark_paid"),
		async (c) => {
			try {
				const organizationId = validateOrgId(
					c.get("session")?.activeOrganizationId as string,
				);
				const user = c.get("user") as { id: string };
				const payoutId = c.req.param("id");

				const result = await markPayoutPaid(payoutId, organizationId, user.id);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "mark payout paid");
			}
		},
	);
