import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { client } from "@/lib/db/schema/store/client";

import { validateEmailUniqueness } from "@/routes/admin-organization/store/client/validation";
import type { StorefrontUpdateClient } from "./schema";

/**
 * Get or create client profile for authenticated user
 */
export async function getMyClient(userId: string, organizationId: string) {
	try {
		// Check if user already has a client record
		const [existingClient] = await db
			.select()
			.from(client)
			.where(
				and(
					eq(client.userId, userId),
					eq(client.organizationId, organizationId),
					isNull(client.deletedAt),
				),
			);

		if (existingClient) {
			console.log(`Found existing client for user ${userId}`);
			return existingClient;
		}

		console.log(`No client found for user ${userId}, creating new one...`);

		// Get user information to create client
		const [userInfo] = await db
			.select({
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				emailVerified: user.emailVerified,
				phone: user.phoneNumber,
				phoneVerified: user.phoneNumberVerified,
			})
			.from(user)
			.where(eq(user.id, userId));

		if (!userInfo) {
			console.error(`User not found: ${userId}`);
			throw new Error("User not found");
		}

		console.log(
			`Creating client for user ${userId} with email ${userInfo.email}`,
		);

		// Create new client from user information
		const [newClient] = await db
			.insert(client)
			.values({
				...userInfo,
				userId,
				organizationId,
				source: "login",
				isActive: true,
			})
			.returning();

		console.log(`Client created successfully: ${newClient.id}`);

		return newClient;
	} catch (error) {
		console.error("Error in getMyClient:", error);
		throw error;
	}
}

/**
 * Update authenticated user's client profile
 * Also syncs firstName and lastName to user record for consistency
 */
export async function updateMyClient(
	userId: string,
	organizationId: string,
	data: StorefrontUpdateClient,
) {
	// Get existing client
	const [existingClient] = await db
		.select()
		.from(client)
		.where(
			and(
				eq(client.userId, userId),
				eq(client.organizationId, organizationId),
				isNull(client.deletedAt),
			),
		);

	if (!existingClient) {
		throw new Error("Client profile not found");
	}

	// Validate email uniqueness if email is being updated
	if (data.email && data.email !== existingClient.email) {
		const isUnique = await validateEmailUniqueness(
			db,
			data.email,
			organizationId,
			existingClient.id,
		);
		if (!isUnique) {
			throw new Error("A client with this email already exists");
		}
	}

	// Auto-set consent dates if consent is given but date is not provided
	const updateData: Record<string, unknown> = { ...data };
	if (data.marketingConsent && !existingClient.marketingConsentDate) {
		updateData.marketingConsentDate = new Date();
	}
	if (data.gdprConsent && !existingClient.gdprConsentDate) {
		updateData.gdprConsentDate = new Date();
	}

	// Sync firstName and lastName to user record if they're being updated
	const userUpdates: Record<string, unknown> = {};
	if (data.firstName !== undefined) {
		userUpdates.firstName = data.firstName;
	}
	if (data.lastName !== undefined) {
		userUpdates.lastName = data.lastName;
	}

	// Update user record if name fields are being changed
	if (Object.keys(userUpdates).length > 0) {
		await db.update(user).set(userUpdates).where(eq(user.id, userId));
	}

	// Update client record
	const [updatedClient] = await db
		.update(client)
		.set(updateData)
		.where(eq(client.id, existingClient.id))
		.returning();

	return updatedClient;
}
