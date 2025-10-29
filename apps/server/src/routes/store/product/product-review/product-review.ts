// --------------------
// Product Review Routes
// --------------------
import { createRouter } from "@/lib/create-hono-app";
import { handleRouteError } from "@/lib/utils/route-helpers";
import {
	idParamSchema,
	jsonValidator,
	paramValidator,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import {
	insertProductReviewSchema,
	updateProductReviewSchema,
} from "../schema";
import {
	createProductReview,
	deleteProductReview,
	getProductReview,
	getProductReviews,
	updateProductReview,
} from "./product-review.service";

// --------------------
export const productReviewRoute = createRouter()
	.post(
		"/product-reviews",
		authMiddleware,
		hasOrgPermission("productReview:create"),
		jsonValidator(insertProductReviewSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");
				const newProductReview = await createProductReview(data, activeOrgId);
				return c.json(newProductReview, 201);
			} catch (error) {
				return handleRouteError(c, error, "create product review");
			}
		},
	)
	.get(
		"/product-reviews",
		authMiddleware,
		hasOrgPermission("productReview:read"),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const foundProductReviews = await getProductReviews(activeOrgId);
				return c.json({ data: foundProductReviews });
			} catch (error) {
				return handleRouteError(c, error, "fetch product reviews");
			}
		},
	)
	.get(
		"/product-reviews/:id",
		authMiddleware,
		hasOrgPermission("productReview:read"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const foundProductReview = await getProductReview(id, activeOrgId);
				if (!foundProductReview)
					return c.json({ error: "Product review not found" }, 404);
				return c.json(foundProductReview);
			} catch (error) {
				return handleRouteError(c, error, "fetch product review");
			}
		},
	)
	.put(
		"/product-reviews/:id",
		authMiddleware,
		hasOrgPermission("productReview:update"),
		paramValidator(idParamSchema),
		jsonValidator(updateProductReviewSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const data = c.req.valid("json");
				const updatedProductReview = await updateProductReview(
					id,
					data,
					activeOrgId,
				);
				if (!updatedProductReview)
					return c.json({ error: "Product review not found" }, 404);
				return c.json(updatedProductReview);
			} catch (error) {
				return handleRouteError(c, error, "update product review");
			}
		},
	)
	.delete(
		"/product-reviews/:id",
		authMiddleware,
		hasOrgPermission("productReview:delete"),
		paramValidator(idParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.valid("param");
				const deletedProductReview = await deleteProductReview(id, activeOrgId);
				if (!deletedProductReview)
					return c.json({ error: "Product review not found" }, 404);
				return c.json({
					message: "Product review deleted successfully",
					deletedProductReview,
				});
			} catch (error) {
				return handleRouteError(c, error, "delete product review");
			}
		},
	);
