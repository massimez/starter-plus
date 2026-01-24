import z from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import {
	jsonValidator,
	paramValidator,
	queryValidator,
} from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import {
	createStockTransaction,
	getProductVariantStock,
	getProductVariantsGroupedByProductWithStock,
	getStockTransactions,
} from "./inventory.service";
import { insertProductVariantStockTransactionSchema } from "./schema";

const productVariantIdParamSchema = z.object({
	productVariantId: z.string().min(1, "productVariantId is required"),
});

const getGroupedInventoryQuerySchema = offsetPaginationSchema.extend({
	locationId: z.string().optional(),
	collectionId: z.string().optional(),
	search: z.string().optional(),
});

// --------------------
// Inventory Routes
// --------------------
export const inventoryRoute = createRouter()
	// Product Variant Stock
	.get(
		"/inventory/stock/:productVariantId",
		authMiddleware,
		hasOrgPermission("inventory:read"),
		paramValidator(productVariantIdParamSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId } = c.req.valid("param");

				const stock = await getProductVariantStock(
					productVariantId,
					activeOrgId,
				);
				return c.json(createSuccessResponse(stock));
			} catch (error) {
				return handleRouteError(c, error, "fetch product variant stock");
			}
		},
	)
	// Product Variant Stock Transactions
	.post(
		"/inventory/stock-transactions",
		authMiddleware,
		hasOrgPermission("inventory:create"),
		jsonValidator(insertProductVariantStockTransactionSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const data = c.req.valid("json");

				const newTransaction = await createStockTransaction(data, activeOrgId);
				return c.json(createSuccessResponse(newTransaction), 201);
			} catch (error) {
				return handleRouteError(c, error, "create stock transaction");
			}
		},
	)
	.get(
		"/inventory/stock-transactions",
		authMiddleware,
		hasOrgPermission("inventory:read"),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");

				const result = await getStockTransactions(
					undefined,
					activeOrgId,
					paginationParams,
				);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch stock transactions");
			}
		},
	)
	.get(
		"/inventory/stock-transactions/:productVariantId",
		authMiddleware,
		hasOrgPermission("inventory:read"),
		paramValidator(productVariantIdParamSchema),
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { productVariantId } = c.req.valid("param");
				const paginationParams = c.req.valid("query");

				const result = await getStockTransactions(
					productVariantId,
					activeOrgId,
					paginationParams,
				);
				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch stock transactions");
			}
		},
	)
	// Product variants grouped by product with stock
	.get(
		"/inventory/grouped-by-product",
		authMiddleware,
		hasOrgPermission("inventory:read"),
		queryValidator(getGroupedInventoryQuerySchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { locationId, ...params } = c.req.valid("query");

				const data = await getProductVariantsGroupedByProductWithStock(
					activeOrgId,
					params,
					locationId,
				);
				return c.json(createSuccessResponse(data));
			} catch (error) {
				return handleRouteError(c, error, "fetch grouped inventory");
			}
		},
	);
