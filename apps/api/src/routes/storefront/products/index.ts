import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { paramValidator, queryValidator } from "@/lib/utils/validator";
import {
	getStorefrontProduct,
	getStorefrontProducts,
} from "./products.service";

export const productsRoutes = createRouter()
	.get(
		"/",
		queryValidator(
			z.object({
				collectionId: z.string().optional(),
				minPrice: z.coerce.number().optional(),
				maxPrice: z.coerce.number().optional(),
				sort: z
					.enum(["price_asc", "price_desc", "newest", "name_asc", "name_desc"])
					.optional(),
				q: z.string().optional(),
				limit: z.coerce.number().default(20),
				offset: z.coerce.number().default(0),
				locationId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const query = c.req.valid("query");
				const organizationId = c.var.tenantId;
				if (!organizationId) throw new Error("Organization ID required");

				const products = await getStorefrontProducts({
					...query,
					organizationId,
				});
				return c.json(createSuccessResponse(products));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront products");
			}
		},
	)
	.get(
		"/:productId",
		paramValidator(
			z.object({
				productId: z.string().min(1),
			}),
		),
		queryValidator(
			z.object({
				locationId: z.string().optional(),
			}),
		),
		async (c) => {
			try {
				const { productId } = c.req.valid("param");
				const query = c.req.valid("query");
				const organizationId = c.var.tenantId;
				if (!organizationId) throw new Error("Organization ID required");
				const { locationId } = query;
				const product = await getStorefrontProduct({
					organizationId,
					productId,
					locationId,
				});

				if (!product) {
					return c.json(
						createErrorResponse("NotFoundError", "Product not found", [
							{
								code: "RESOURCE_NOT_FOUND",
								path: ["productId"],
								message: "Product not found",
							},
						]),
						404,
					);
				}

				return c.json(createSuccessResponse(product));
			} catch (error) {
				return handleRouteError(c, error, "fetch storefront product");
			}
		},
	);
