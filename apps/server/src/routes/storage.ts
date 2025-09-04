import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import env from "@/env";
import { createRouter } from "@/lib/create-hono-app";
import { jsonValidator } from "@/lib/utils/validator";
import { authMiddleware } from "@/middleware/auth";
import { hasOrgPermission } from "@/middleware/org-permission";
import { r2 } from "../lib/r2";

const presignSchema = z.object({
	fileName: z.string(),
	contentType: z.string(),
	visibility: z.string().optional(),
});

const storageRoutes = createRouter()
	.post(
		"/presign",
		authMiddleware,
		hasOrgPermission("storage:write"),
		jsonValidator(presignSchema),
		async (c) => {
			const user = c.get("user");
			const activeOrgId = c.get("session")?.activeOrganizationId as string;

			const tenantId = activeOrgId || user?.id;

			const {
				fileName,
				contentType,
				visibility = "public",
			} = await c.req.json();

			const safeName = fileName.replace(/[^\w.-]+/g, "_");
			const key = `${tenantId}/${visibility}/uploads/${crypto.randomUUID()}-${safeName}`;

			const url = await getSignedUrl(
				r2,
				new PutObjectCommand({
					// biome-ignore lint/style/noNonNullAssertion: <>
					Bucket: env?.CF_BUCKET_NAME!,
					Key: key,
					ContentType: contentType,
					// Cache forever for public assets (use hashed names to bust)
					CacheControl:
						visibility === "public"
							? "public, max-age=31536000, immutable"
							: undefined,
				}),
				{ expiresIn: 60 * 5 }, // 5 minutes
			);

			const publicUrl =
				visibility === "public" ? `${process.env.CDN_BASE_URL}${key}` : null;

			return c.json({ url, key, publicUrl });
		},
	)
	.delete(
		"/:key",
		authMiddleware,
		hasOrgPermission("storage:write"),
		async (c) => {
			const user = c.get("user");
			const activeOrgId = c.get("session")?.activeOrganizationId as string;

			const { key } = c.req.param(); // key = tenantId/public/uploads/...

			// Optional: check that the key belongs to this user (tenant) or organization
			if (!key.startsWith(activeOrgId) && !key.startsWith(user?.id!)) {
				return c.json({ error: "Forbidden" }, 403);
			}

			await r2.send(
				new DeleteObjectCommand({
					Bucket: env?.CF_BUCKET_NAME!,
					Key: key,
				}),
			);

			return c.json({ success: true });
		},
	);

export default storageRoutes;
