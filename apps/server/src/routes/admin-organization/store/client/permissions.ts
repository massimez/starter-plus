import type { AdminUpdateClient } from "./schema";

/**
 * Check if user has permission to update protected fields
 * This should integrate with your existing permission system
 */
export function canUpdateProtectedFields(userRole: string): boolean {
	// Define which roles can update protected fields
	const adminRoles = ["admin", "owner", "super_admin"];
	return adminRoles.includes(userRole.toLowerCase());
}

/**
 * Extract protected fields from update data
 */
export function extractProtectedFields(
	data: AdminUpdateClient,
): Partial<AdminUpdateClient> {
	const protectedFields: Partial<AdminUpdateClient> = {};

	if ("emailVerified" in data)
		protectedFields.emailVerified = data.emailVerified;
	if ("phoneVerified" in data)
		protectedFields.phoneVerified = data.phoneVerified;
	if ("isBlacklisted" in data)
		protectedFields.isBlacklisted = data.isBlacklisted;
	if ("fraudScore" in data) protectedFields.fraudScore = data.fraudScore;

	return protectedFields;
}

/**
 * Check if update contains any protected fields
 */
export function hasProtectedFields(data: AdminUpdateClient): boolean {
	return (
		"emailVerified" in data ||
		"phoneVerified" in data ||
		"isBlacklisted" in data ||
		"fraudScore" in data
	);
}

/**
 * Validate fraud score update
 */
export function validateFraudScoreUpdate(
	oldScore: number | string | null,
	newScore: number | string,
): { valid: boolean; error?: string } {
	const score =
		typeof newScore === "string" ? Number.parseFloat(newScore) : newScore;

	if (Number.isNaN(score)) {
		return { valid: false, error: "Fraud score must be a valid number" };
	}

	if (score < 0 || score > 100) {
		return { valid: false, error: "Fraud score must be between 0 and 100" };
	}

	// Optional: Add business logic for fraud score changes
	// For example, require justification for large changes
	if (oldScore !== null) {
		const oldScoreNum =
			typeof oldScore === "string" ? Number.parseFloat(oldScore) : oldScore;
		const diff = Math.abs(score - oldScoreNum);
		if (diff > 50) {
			// Large change - might want to require additional validation
			console.warn(
				`Large fraud score change detected: ${oldScoreNum} -> ${score}`,
			);
		}
	}

	return { valid: true };
}
