import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs));
}

/**
 * Safely retrieves a nested property from an object.
 *
 * @param obj - The object to query.
 * @param key - The dot-separated path to the property.
 * @returns The value of the property, or `undefined` if not found.
 */
export function getProperty<T, K extends string>(
	obj: T,
	key: K,
): K extends keyof T ? T[K] : any {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return key?.split(".").reduce((o, i) => (o ? o[i] : undefined), obj as any);
}

// Utility function to extract error message from response
export async function extractErrorMessage(res: Response): Promise<string> {
	try {
		const errorData = await res.json();
		return errorData.error.message || errorData.error || res.statusText;
	} catch {
		return res.statusText;
	}
}

export const removeNulls = (obj: any): any => {
	if (Array.isArray(obj)) {
		return obj
			.map((item) => removeNulls(item))
			.filter((item) => item !== null && item !== undefined);
	}
	if (obj && typeof obj === "object") {
		return Object.entries(obj).reduce(
			(acc, [key, value]) => {
				if (value !== null && value !== undefined) {
					const cleaned = removeNulls(value);
					if (cleaned !== null && cleaned !== undefined) {
						acc[key] = cleaned;
					}
				}
				return acc;
			},
			{} as Record<string, any>,
		);
	}
	return obj;
};
