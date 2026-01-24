import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, inArray, lt, sql } from "drizzle-orm";

import { envData } from "@/env";
import type { User } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizationStorageLimits, uploads } from "@/lib/db/schema";
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
	organizationId?: string,
): Promise<PresignResult> {
	// Check storage limits if organizationId is provided
	if (organizationId && size) {
		const limits = await db.query.organizationStorageLimits.findFirst({
			where: eq(organizationStorageLimits.organizationId, organizationId),
		});

		if (limits) {
			const projectedUsage = (limits.currentUsage || 0) + size;
			if (projectedUsage > limits.storageLimit) {
				throw new Error("Storage limit exceeded");
			}
		}
	}

	// Sanitize filename
	const safeName = fileName.replace(/[^\w.-]+/g, "_");
	const key = `${tenantId}/${visibility}/uploads/${crypto.randomUUID()}-${safeName}`;

	if (!envData.CF_BUCKET_NAME) {
		throw new Error("CF_BUCKET_NAME is undefined");
	}

	// Insert pending record
	const [upload] = await db
		.insert(uploads)
		.values({
			fileKey: key,
			bucket: envData.CF_BUCKET_NAME,
			contentType,
			size,
			status: "pending",
			userId: user?.id,
			organizationId,
			expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min expiry
		})
		.returning();

	// Generate presigned PUT URL
	const url = await getSignedUrl(
		r2,
		new PutObjectCommand({
			Bucket: envData.CF_BUCKET_NAME,
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
		visibility === "public" ? `${envData.CDN_BASE_URL}${key}` : null;

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

	// Update storage usage for each committed file
	for (const upload of uploadsCommitted) {
		if (upload.organizationId && upload.size) {
			await db
				.insert(organizationStorageLimits)
				.values({
					organizationId: upload.organizationId,
					currentUsage: upload.size,
					storageLimit: 1073741824, // Default 1GB
				})
				.onConflictDoUpdate({
					target: organizationStorageLimits.organizationId,
					set: {
						currentUsage: sql`${organizationStorageLimits.currentUsage} + ${upload.size}`,
						updatedAt: new Date(),
					},
				});
		}
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
			Bucket: envData.CF_BUCKET_NAME,
			Key: key,
		}),
	);

	const deletedUploads = await db
		.update(uploads)
		.set({
			status: "deleted",
			deletedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(uploads.fileKey, key))
		.returning();

	if (deletedUploads.length > 0) {
		const upload = deletedUploads[0];
		if (upload.organizationId && upload.size) {
			await db
				.update(organizationStorageLimits)
				.set({
					currentUsage: sql`${organizationStorageLimits.currentUsage} - ${upload.size}`,
					updatedAt: new Date(),
				})
				.where(
					eq(organizationStorageLimits.organizationId, upload.organizationId),
				);
		}
	}

	return { data: { success: true }, error: null };
}

/**
 * Cleanup orphan files (pending uploads that expired)
 */
export async function cleanupOrphanFiles() {
	const expiredTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

	const expiredUploads = await db
		.select()
		.from(uploads)
		.where(
			and(eq(uploads.status, "pending"), lt(uploads.expiresAt, expiredTime)),
		)
		.limit(50); // Process in batches

	let deletedCount = 0;

	for (const upload of expiredUploads) {
		try {
			await r2.send(
				new DeleteObjectCommand({
					Bucket: envData.CF_BUCKET_NAME,
					Key: upload.fileKey,
				}),
			);

			await db.delete(uploads).where(eq(uploads.id, upload.id));
			deletedCount++;
		} catch (error) {
			console.error(`Failed to delete orphan file ${upload.fileKey}:`, error);
		}
	}

	return { deletedCount };
}
