import { z } from "zod";
import { createRouter } from "@/lib/create-hono-app";
import {
	createErrorResponse,
	createSuccessResponse,
	handleRouteError,
} from "@/lib/utils/route-helpers";
import { jsonValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";

import {
	type CommitParams,
	cleanupOrphanFiles,
	commitUploads,
	deleteUploadedFile,
	type PresignParams,
	presignUpload,
} from "./storage.service";

const presignSchema = z.object({
	fileName: z.string(),
	contentType: z.string(),
	visibility: z.enum(["public", "private"]).optional().default("public"),
	size: z.number().optional(),
});

const commitSchema = z.object({
	uploadIds: z.array(z.uuid()),
	entityType: z.string().optional(),
	entityId: z.string().optional(),
});

// ---------------------------------------------------
// 🚀 Router
// ---------------------------------------------------

const storageRoutes = createRouter()
	// STEP 1: Request presigned upload URL + create pending upload record
	.post(
		"/presign",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(presignSchema),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const tenantId = activeOrgId || user?.id;
				const presignParams: PresignParams = c.req.valid("json");

				const result = await presignUpload(
					presignParams,
					user,
					tenantId,
					activeOrgId,
				);

				return c.json(createSuccessResponse(result));
			} catch (error) {
				return handleRouteError(c, error, "presign upload");
			}
		},
	)

	// STEP 2: Commit the upload once the file is successfully uploaded
	.post(
		"/commit",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(commitSchema),
		async (c) => {
			try {
				const commitParams: CommitParams = c.req.valid("json");
				const result = await commitUploads(commitParams);

				if (result.error) {
					return c.json(
						createErrorResponse("CommitError", result.error, [
							{
								code: "UPLOAD_COMMIT_FAILED",
								path: [],
								message: result.error,
							},
						]),
						404,
					);
				}

				return c.json(
					createSuccessResponse(result.data, "Uploads committed successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "commit uploads");
			}
		},
	)

	// DELETE: Remove uploaded file (with ownership validation)
	.delete(
		"/:key",
		authMiddleware,
		hasOrgPermission("storage:write"),
		async (c) => {
			try {
				// biome-ignore lint/style/noNonNullAssertion: <>
				const user = c.get("user")!;
				const activeOrgId = c.get("session")?.activeOrganizationId as string;
				const { key } = c.req.param();

				const result = await deleteUploadedFile(key, user, activeOrgId);

				if (result.error) {
					return c.json(
						createErrorResponse("ForbiddenError", result.error, [
							{
								code: "FILE_ACCESS_DENIED",
								path: ["key"],
								message: result.error,
							},
						]),
						403,
					);
				}

				return c.json(
					createSuccessResponse(result.data, "File deleted successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "delete upload");
			}
		},
	)

	// POST: Cleanup orphan files (admin only or scheduled job)
	.post(
		"/cleanup",
		authMiddleware,
		// TODO: Add admin check or secret key check for security
		async (c) => {
			try {
				const result = await cleanupOrphanFiles();
				return c.json(
					createSuccessResponse(result, "Orphan files cleaned up successfully"),
				);
			} catch (error) {
				return handleRouteError(c, error, "cleanup orphan files");
			}
		},
	);

export default storageRoutes;
