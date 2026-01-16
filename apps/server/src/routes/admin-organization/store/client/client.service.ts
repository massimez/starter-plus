import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { client } from "@/lib/db/schema/store/client";
import type { AdminUpdateClient, InsertClient, UpdateClient } from "./schema";
import { validateEmailUniqueness } from "./validation";

/**
 * Create a new client
 */
export async function createClient(
	data: InsertClient,
	organizationId: string,
	_userId?: string,
) {
	// Validate email uniqueness if email is provided
	if (data.email) {
		const isUnique = await validateEmailUniqueness(
			db,
			data.email,
			organizationId,
		);
		if (!isUnique) {
			throw new Error("A client with this email already exists");
		}
	}

	// Auto-set consent dates if consent is given but date is not provided
	const clientData: Record<string, unknown> = { ...data };
	if (data.marketingConsent && !data.marketingConsentDate) {
		clientData.marketingConsentDate = new Date();
	}
	if (data.gdprConsent && !data.gdprConsentDate) {
		clientData.gdprConsentDate = new Date();
	}

	const [newClient] = await db
		.insert(client)
		.values({
			...clientData,
			organizationId,
		})
		.returning();

	return newClient;
}

/**
 * Get all clients for an organization with pagination
 */
export async function getClients(
	organizationId: string,
	limit = 10,
	offset = 0,
) {
	const clients = await db
		.select()
		.from(client)
		.where(eq(client.organizationId, organizationId))
		.orderBy(desc(client.createdAt))
		.limit(limit)
		.offset(offset);

	const [totalCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(client)
		.where(eq(client.organizationId, organizationId));

	return {
		clients,
		total: totalCount.count,
		limit,
		offset,
	};
}

/**
 * Get a single client by ID
 */
export async function getClient(id: string, organizationId: string) {
	const [foundClient] = await db
		.select()
		.from(client)
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)));

	return foundClient;
}

/**
 * Update a client
 */
export async function updateClient(
	id: string,
	data: UpdateClient,
	organizationId: string,
	_userId?: string,
) {
	// Get existing client for audit comparison
	const [existingClient] = await db
		.select()
		.from(client)
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)));

	if (!existingClient) {
		return null;
	}

	// Validate email uniqueness if email is being updated
	if (data.email && data.email !== existingClient.email) {
		const isUnique = await validateEmailUniqueness(
			db,
			data.email,
			organizationId,
			id, // Exclude current client from uniqueness check
		);
		if (!isUnique) {
			throw new Error("A client with this email already exists");
		}
	}

	// Auto-set consent dates if consent is given but date is not provided
	const updateData: Record<string, unknown> = { ...data };
	if (data.marketingConsent && !data.marketingConsentDate) {
		updateData.marketingConsentDate = new Date();
	}
	if (data.gdprConsent && !data.gdprConsentDate) {
		updateData.gdprConsentDate = new Date();
	}

	const [updatedClient] = await db
		.update(client)
		.set(updateData)
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)))
		.returning();

	return updatedClient;
}

/**
 * Delete a client (soft delete)
 */
export async function deleteClient(
	id: string,
	organizationId: string,
	_userId?: string,
) {
	const [deletedClient] = await db
		.update(client)
		.set({
			isActive: false,
			deletedAt: new Date(),
		})
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)))
		.returning();

	return deletedClient;
}

/**
 * Admin-only update function for protected fields
 * Allows updating emailVerified, phoneVerified, isBlacklisted, fraudScore
 */
export async function adminUpdateClient(
	id: string,
	data: AdminUpdateClient,
	organizationId: string,
	_userId?: string,
) {
	// Get existing client for audit comparison
	const [existingClient] = await db
		.select()
		.from(client)
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)));

	if (!existingClient) {
		return null;
	}

	// Validate email uniqueness if email is being updated
	if (data.email && data.email !== existingClient.email) {
		const isUnique = await validateEmailUniqueness(
			db,
			data.email,
			organizationId,
			id,
		);
		if (!isUnique) {
			throw new Error("A client with this email already exists");
		}
	}

	// Auto-set consent dates if consent is given but date is not provided
	const updateData: Record<string, unknown> = { ...data };
	if (data.marketingConsent && !data.marketingConsentDate) {
		updateData.marketingConsentDate = new Date();
	}
	if (data.gdprConsent && !data.gdprConsentDate) {
		updateData.gdprConsentDate = new Date();
	}

	const [updatedClient] = await db
		.update(client)
		.set(updateData)
		.where(and(eq(client.id, id), eq(client.organizationId, organizationId)))
		.returning();

	return updatedClient;
}

/**
 * Link a user account to an existing client
 */
export async function linkUserToClient(
	clientId: string,
	userId: string,
	organizationId: string,
) {
	// Get user information
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
		throw new Error("User not found");
	}

	// Update client with user information and link
	const [linkedClient] = await db
		.update(client)
		.set({
			...userInfo,
			userId, // Link the user
		})
		.where(
			and(eq(client.id, clientId), eq(client.organizationId, organizationId)),
		)
		.returning();

	return linkedClient;
}

/**
 * Unlink a user from a client (keeps client data as-is)
 */
export async function unlinkUserFromClient(
	clientId: string,
	userId: string,
	organizationId: string,
) {
	const [unlinkedClient] = await db
		.update(client)
		.set({
			userId: null, // Remove the link
		})
		.where(
			and(
				eq(client.id, clientId),
				eq(client.organizationId, organizationId),
				eq(client.userId, userId),
			),
		)
		.returning();

	return unlinkedClient;
}

/**
 * Sync user account changes to linked client
 */
export async function syncUserToClient(userId: string, organizationId: string) {
	// Get user information
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
		throw new Error("User not found");
	}

	// Update all clients linked to this user in this organization
	const syncResult = await db
		.update(client)
		.set({
			...userInfo,
		})
		.where(
			and(eq(client.userId, userId), eq(client.organizationId, organizationId)),
		)
		.returning();

	return syncResult;
}

/**
 * Sync client preferences back to user account
 */
export async function syncClientPreferencesToUser(
	clientId: string,
	organizationId: string,
) {
	// Get client information
	const [clientInfo] = await db
		.select({
			userId: client.userId,
			language: client.language,
			timezone: client.timezone,
			marketingConsent: client.marketingConsent,
		})
		.from(client)
		.where(
			and(eq(client.id, clientId), eq(client.organizationId, organizationId)),
		);

	if (!clientInfo || !clientInfo.userId) {
		throw new Error("Client not found or not linked to user");
	}

	// Update user with client preferences
	const [updatedUser] = await db
		.update(user)
		.set({
			// Note: Add user preferences fields if they exist, or map to existing fields
			// For now, this is a placeholder for future user preference fields
		})
		.where(eq(user.id, clientInfo.userId))
		.returning();

	return updatedUser;
}

/**
 * Find or create client from user information (login/purchase)
 */
export async function findOrCreateClientFromUser(
	userId: string,
	organizationId: string,
	source: "login" | "purchase" = "login",
) {
	// Check if user is already linked to a client
	const [existingClient] = await db
		.select()
		.from(client)
		.where(
			and(eq(client.userId, userId), eq(client.organizationId, organizationId)),
		);

	if (existingClient) {
		// Sync latest user info to client and return
		await syncUserToClient(userId, organizationId);
		const [updatedClient] = await db
			.select()
			.from(client)
			.where(eq(client.id, existingClient.id));
		return updatedClient;
	}

	// Get user information
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
		throw new Error("User not found");
	}

	// Create new client from user information
	const newClient = await createClient(
		{
			...userInfo,
			// userId will be set separately after creation if needed
			source,
		} as InsertClient,
		organizationId,
	);

	return newClient;
}

/**
 * Update client statistics when order is created (pending)
 */
export async function incrementClientUncompletedOrders(
	userId: string,
	organizationId: string,
	tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
	const [clientRecord] = await tx
		.select()
		.from(client)
		.where(
			and(eq(client.userId, userId), eq(client.organizationId, organizationId)),
		);

	if (clientRecord) {
		await tx
			.update(client)
			.set({
				totalUncompletedOrders: (clientRecord.totalUncompletedOrders || 0) + 1,
			})
			.where(eq(client.id, clientRecord.id));
	}
}

/**
 * Update client statistics when order is completed
 */
export async function updateClientStatsOnOrderCompletion(
	userId: string,
	organizationId: string,
	orderAmount: string,
	tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
	const [clientRecord] = await tx
		.select()
		.from(client)
		.where(
			and(eq(client.userId, userId), eq(client.organizationId, organizationId)),
		);

	if (clientRecord) {
		const newTotalOrders = (clientRecord.totalOrders || 0) + 1;
		const newTotalSpent =
			Number(clientRecord.totalSpent || 0) + Number(orderAmount);
		const newUncompletedOrders = Math.max(
			0,
			(clientRecord.totalUncompletedOrders || 0) - 1,
		);

		await tx
			.update(client)
			.set({
				totalOrders: newTotalOrders,
				totalUncompletedOrders: newUncompletedOrders,
				totalSpent: newTotalSpent.toString(),
				lastPurchaseDate: new Date(),
				firstPurchaseDate: clientRecord.firstPurchaseDate || new Date(),
			})
			.where(eq(client.id, clientRecord.id));
	}
}

/**
 * Update client statistics when order is cancelled
 */
export async function decrementClientUncompletedOrders(
	userId: string,
	organizationId: string,
	tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0],
) {
	const [clientRecord] = await tx
		.select()
		.from(client)
		.where(
			and(eq(client.userId, userId), eq(client.organizationId, organizationId)),
		);

	if (clientRecord) {
		const newUncompletedOrders = Math.max(
			0,
			(clientRecord.totalUncompletedOrders || 0) - 1,
		);

		await tx
			.update(client)
			.set({
				totalUncompletedOrders: newUncompletedOrders,
			})
			.where(eq(client.id, clientRecord.id));
	}
}
