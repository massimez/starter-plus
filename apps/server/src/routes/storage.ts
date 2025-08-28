import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import env from "@/env";
import { createRouter } from "@/lib/create-hono-app";
import { authMiddleware } from "@/middleware/auth";
import { r2 } from "../lib/r2";

const storageRoutes = createRouter()
	.post("/presign", authMiddleware, async (c) => {
		const user = c.get("Variables").user; // your auth middleware

		const tenantId = user?.id;

		const { fileName, contentType, visibility = "public" } = await c.req.json();

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
			visibility === "public" ? `${process.env.CDN_BASE_URL}/${key}` : null;

		return c.json({ url, key, publicUrl });
	})
	.delete("/:key", authMiddleware, async (c) => {
		const user = c.get("Variables").user;
		if (!user) {
			return c.json({ success: false, error: "Unauthorized" }, 401);
		}

		const tenantId = user.id;
		const keyToDelete = c.req.param("key");

		// Ensure the user can only delete their own files by checking the tenantId prefix
		if (!keyToDelete.startsWith(`${tenantId}/`)) {
			return c.json({ success: false, error: "Forbidden" }, 403);
		}

		try {
			await r2.send(
				new DeleteObjectCommand({
					Bucket: env?.CF_BUCKET_NAME!,
					Key: keyToDelete,
				}),
			);
			return c.json({ success: true, message: "Object deleted successfully" });
		} catch (error) {
			console.error("Error deleting object:", error);
			return c.json({ success: false, error: "Failed to delete object" }, 500);
		}
	});

export default storageRoutes;
