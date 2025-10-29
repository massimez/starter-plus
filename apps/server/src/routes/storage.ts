import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq, inArray } from "drizzle-orm";

import { z } from "zod";
import env from "@/env";
import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { jsonValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { r2 } from "../lib/r2";

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
			const user = c.get("user");
			const activeOrgId = c.get("session")?.activeOrganizationId as string;

			const tenantId = activeOrgId || user?.id;
			const { fileName, contentType, visibility, size } = await c.req.json();

			// sanitize filename
			const safeName = fileName.replace(/[^\w.-]+/g, "_");
			const key = `${tenantId}/${visibility}/uploads/${crypto.randomUUID()}-${safeName}`;
			if (env.CF_BUCKET_NAME === undefined) {
				throw new Error("CF_BUCKET_NAME is undefined");
			}
			// Insert pending record
			const [upload] = await db
				.insert(uploads)
				.values({
					fileKey: key,
					bucket: env.CF_BUCKET_NAME,
					contentType,
					size,
					status: "pending",
					userId: user?.id,
					expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min expiry
				})
				.returning();

			// Generate presigned PUT URL
			const url = await getSignedUrl(
				r2,
				new PutObjectCommand({
					Bucket: env?.CF_BUCKET_NAME,
					Key: key,
					ContentType: contentType,
					CacheControl:
						visibility === "public"
							? "public, max-age=31536000, immutable"
							: undefined,
				}),
				{ expiresIn: 60 * 5 }, // 5 minutes
			);

			const publicUrl =
				visibility === "public" ? `${process.env.CDN_BASE_URL}${key}` : null;

			return c.json({ uploadId: upload.id, url, key, publicUrl });
		},
	)

	// STEP 2: Commit the upload once the file is successfully uploaded
	.post(
		"/commit",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(commitSchema),
		async (c) => {
			const { uploadIds, entityType, entityId } = await c.req.json();

			const uploadsCommitted = await db
				.update(uploads)
				.set({ status: "committed", updatedAt: new Date() })
				.where(inArray(uploads.id, uploadIds))
				.returning();

			if (!uploadsCommitted.length) {
				return c.json({ error: "No matching uploads found" }, 404);
			}

			// (Optional) Link the upload to an entity
			if (entityType && entityId) {
				// Example: insert into upload_links or update entity record
				console.log(`Linked uploads to ${entityType}:${entityId}`);
			}

			return c.json({ success: true, uploads: uploadsCommitted });
		},
	)

	// DELETE: Remove uploaded file (with ownership validation)
	.delete(
		"/:key",
		authMiddleware,
		hasOrgPermission("storage:write"),
		async (c) => {
			// biome-ignore lint/style/noNonNullAssertion: <authMiddleware>
			const user = c.get("user")!;
			const activeOrgId = c.get("session")?.activeOrganizationId as string;
			const { key } = c.req.param();

			// Verify ownership (tenant)
			if (!key.startsWith(activeOrgId) && !key.startsWith(user.id)) {
				return c.json({ error: "Forbidden" }, 403);
			}

			await r2.send(
				new DeleteObjectCommand({
					Bucket: env.CF_BUCKET_NAME,
					Key: key,
				}),
			);

			await db
				.update(uploads)
				.set({
					status: "deleted",
					deletedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(uploads.fileKey, key));

			return c.json({ success: true });
		},
	);

export default storageRoutes;
