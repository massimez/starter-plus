import { db } from "@/lib/db";
import { client } from "@/lib/db/schema/store/client";

/**
 * Create a client record for a newly registered user
 * Called automatically during user registration
 */
export async function createClientForNewUser(
	userId: string,
	organizationId: string,
	userData: {
		firstName?: string | null;
		lastName?: string | null;
		email: string;
		emailVerified: boolean;
		phoneNumber?: string | null;
		phoneNumberVerified?: boolean;
	},
) {
	try {
		// Check if client already exists (prevent duplicates)
		const existingClient = await db.query.client.findFirst({
			where: (client, { and, eq }) =>
				and(
					eq(client.userId, userId),
					eq(client.organizationId, organizationId),
				),
		});

		if (existingClient) {
			console.log(`Client already exists for user ${userId}`);
			return existingClient;
		}

		// Create new client from user information
		const [newClient] = await db
			.insert(client)
			.values({
				userId,
				organizationId,
				firstName: userData.firstName,
				lastName: userData.lastName,
				email: userData.email,
				emailVerified: userData.emailVerified,
				phone: userData.phoneNumber,
				phoneVerified: userData.phoneNumberVerified || false,
				source: "registration",
				isActive: true,
			})
			.returning();

		console.log(`Client created for user ${userId}: ${newClient.id}`);
		return newClient;
	} catch (error) {
		console.error("Failed to create client for new user:", error);
		// Don't throw - registration should succeed even if client creation fails
		// Client will be auto-created on first profile access as fallback
		return null;
	}
}
