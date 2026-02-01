/**
 * Generates a URL-friendly slug from a string.
 * Replaces non-alphanumeric characters with hyphens and removes leading/trailing hyphens.
 */
export function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
		.replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
