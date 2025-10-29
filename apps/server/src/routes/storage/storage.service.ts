import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq, inArray } from "drizzle-orm";

import env from "@/env";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { r2 } from "@/lib/r2";

export interface PresignParams {
	fileName: string;
	contentType: string;
	visibility: "public" | "private";
	size?: number;
}

export interface PresignResult {
	uploadId: string;
	url: string;
	key: string;
	publicUrl: string | null;
}

export interface CommitParams {
	uploadIds: string[];
	entityType?: string;
	entityId?: string;
}

/**
 * Generate presigned upload URL and create pending upload record
 */
export async function presignUpload(
	{ fileName, contentType, visibility, size }: PresignParams,
	user: User,
	tenantId: string,
): Promise<PresignResult> {
	// Sanitize filename
	const safeName = fileName.replace(/[^\w.-]+/g, "_");
	const key = `${tenantId}/${visibility}/uploads/${crypto.randomUUID()}-${safeName}`;

	if (!env.CF_BUCKET_NAME) {
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
			Bucket: env.CF_BUCKET_NAME,
			Key: key,
			ContentType: contentType,
			CacheControl:
				visibility === "public"
					? "public, max-age=31536000, immutable"
					: undefined,
		}),
		{ expiresIn: 300 }, // 5 minutes
	);

	const publicUrl =
		visibility === "public" ? `${process.env.CDN_BASE_URL}${key}` : null;

	return {
		uploadId: upload.id,
		url,
		key,
		publicUrl,
	};
}

/**
 * Commit the uploaded files to mark them as completed
 */
export async function commitUploads({
	uploadIds,
	entityType,
	entityId,
}: CommitParams) {
	const uploadsCommitted = await db
		.update(uploads)
		.set({ status: "committed", updatedAt: new Date() })
		.where(inArray(uploads.id, uploadIds))
		.returning();

	if (!uploadsCommitted.length) {
		return { error: "No matching uploads found", data: null };
	}

	// (Optional) Link the upload to an entity
	if (entityType && entityId) {
		console.log(`Linked uploads to ${entityType}:${entityId}`);
	}

	return { data: uploadsCommitted, error: null };
}

/**
 * Delete uploaded file and mark as deleted in database
 */
export async function deleteUploadedFile(
	key: string,
	user: User,
	activeOrgId: string | undefined,
) {
	// Verify ownership (tenant)
	if (
		!activeOrgId ||
		(!key.startsWith(activeOrgId) && !key.startsWith(user.id))
	) {
		return { error: "Forbidden", data: null };
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

	return { data: { success: true }, error: null };
}
