import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { jsonValidator, queryValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { offsetPaginationSchema } from "@/middleware/pagination";
import { rateLimiter } from "@/middleware/rate-limiter";

import {
	adminUpdateClient,
	createClient,
	deleteClient,
	getClient,
	getClients,
	updateClient,
} from "./client.service";
import {
	adminUpdateClientSchema,
	insertClientSchema,
	updateClientSchema,
} from "./schema";
import { uuidSchema } from "./validation";

// --------------------
// Client Routes
// --------------------
export const clientRoute = createRouter()
	.post(
		"/clients",
		authMiddleware,
		hasOrgPermission("client:create"),
		rateLimiter(60000, 20), // 20 requests per minute
		jsonValidator(insertClientSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const userId = c.get("session")?.userId as string;
				const clientData = c.req.valid("json");
				const newClient = await createClient(clientData, activeOrgId, userId);
				return c.json(createSuccessResponse(newClient), 201);
			} catch (error) {
				return handleRouteError(c, error, "create client");
			}
		},
	)
	.get(
		"/clients",
		authMiddleware,
		hasOrgPermission("client:read"),
		rateLimiter(60000, 100), // 100 requests per minute for reads
		queryValidator(offsetPaginationSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const paginationParams = c.req.valid("query");

				const result = await getClients(
					activeOrgId,
					paginationParams.limit,
					paginationParams.offset,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "fetch clients");
			}
		},
	)
	.get(
		"/clients/:id",
		authMiddleware,
		hasOrgPermission("client:read"),
		rateLimiter(60000, 100), // 100 requests per minute for reads
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { id } = c.req.param();

				// Validate UUID format
				const parseResult = uuidSchema.safeParse(id);
				if (!parseResult.success) {
					return c.json(
						createErrorResponse("ValidationError", "Invalid client ID format", [
							{
								code: "INVALID_UUID",
								path: ["id"],
								message: "Client ID must be a valid UUID",
							},
						]),
						400,
					);
				}

				const foundClient = await getClient(id, activeOrgId);
				if (!foundClient)
					return c.json(
						createErrorResponse("NotFoundError", "Client not found", [
							{
								code: "CLIENT_NOT_FOUND",
								path: ["id"],
								message: "No client found with the provided id",
							},
						]),
						404,
					);

				return c.json(createSuccessResponse(foundClient));
			} catch (error) {
				return handleRouteError(c, error, "fetch client");
			}
		},
	)
	.put(
		"/clients/:id",
		authMiddleware,
		hasOrgPermission("client:update"),
		rateLimiter(60000, 30), // 30 requests per minute for updates
		jsonValidator(updateClientSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const userId = c.get("session")?.userId as string;
				const { id } = c.req.param();
				const clientData = c.req.valid("json");

				// Validate UUID format
				const parseResult = uuidSchema.safeParse(id);
				if (!parseResult.success) {
					return c.json(
						createErrorResponse("ValidationError", "Invalid client ID format", [
							{
								code: "INVALID_UUID",
								path: ["id"],
								message: "Client ID must be a valid UUID",
							},
						]),
						400,
					);
				}

				const updatedClient = await updateClient(
					id,
					clientData,
					activeOrgId,
					userId,
				);
				if (!updatedClient)
					return c.json(
						createErrorResponse("NotFoundError", "Client not found", [
							{
								code: "CLIENT_NOT_FOUND",
								path: ["id"],
								message: "No client found with the provided id",
							},
						]),
						404,
					);
				return c.json(createSuccessResponse(updatedClient));
			} catch (error) {
				return handleRouteError(c, error, "update client");
			}
		},
	)
	.put(
		"/clients/:id/admin",
		authMiddleware,
		hasOrgPermission("client:admin"), // Requires admin permission
		rateLimiter(60000, 10), // Stricter rate limit for admin operations
		jsonValidator(adminUpdateClientSchema),
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const userId = c.get("session")?.userId as string;
				const { id } = c.req.param();
				const clientData = c.req.valid("json");

				// Validate UUID format
				const parseResult = uuidSchema.safeParse(id);
				if (!parseResult.success) {
					return c.json(
						createErrorResponse("ValidationError", "Invalid client ID format", [
							{
								code: "INVALID_UUID",
								path: ["id"],
								message: "Client ID must be a valid UUID",
							},
						]),
						400,
					);
				}

				const updatedClient = await adminUpdateClient(
					id,
					clientData,
					activeOrgId,
					userId,
				);
				if (!updatedClient)
					return c.json(
						createErrorResponse("NotFoundError", "Client not found", [
							{
								code: "CLIENT_NOT_FOUND",
								path: ["id"],
								message: "No client found with the provided id",
							},
						]),
						404,
					);
				return c.json(createSuccessResponse(updatedClient));
			} catch (error) {
				return handleRouteError(c, error, "admin update client");
			}
		},
	)
	.delete(
		"/clients/:id",
		authMiddleware,
		hasOrgPermission("client:delete"),
		rateLimiter(60000, 20), // 20 requests per minute for deletes
		async (c) => {
			try {
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const userId = c.get("session")?.userId as string;
				const { id } = c.req.param();

				// Validate UUID format
				const parseResult = uuidSchema.safeParse(id);
				if (!parseResult.success) {
					return c.json(
						createErrorResponse("ValidationError", "Invalid client ID format", [
							{
								code: "INVALID_UUID",
								path: ["id"],
								message: "Client ID must be a valid UUID",
							},
						]),
						400,
					);
				}

				const deletedClient = await deleteClient(id, activeOrgId, userId);
				if (!deletedClient)
					return c.json(
						createErrorResponse("NotFoundError", "Client not found", [
							{
								code: "CLIENT_NOT_FOUND",
								path: ["id"],
								message: "No client found with the provided id",
							},
						]),
						404,
					);
				return c.json(
					createSuccessResponse(deletedClient, "Client deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete client");
			}
		},
	);
