/**
 * Simple date formatting helper to replace date-fns
 */

/**
 * Formats a date string, number, or Date object into a readable string.
 * Default format is "DD MM YYYY" (e.g., "24 12 2025")
 *
 * @param input - The date to format
 * @param formatStr - The format string
 * @returns Formatted date string
 */
export function formatDate(
	input: string | number | Date | null | undefined,
	formatStr = "DD MM YYYY",
): string {
	if (!input) return "";

	const date = new Date(input);
	if (Number.isNaN(date.getTime())) return "";

	const d = date.getDate().toString().padStart(2, "0");
	const m = (date.getMonth() + 1).toString().padStart(2, "0");
	const y = date.getFullYear();

	if (formatStr === "yyyy-MM-dd") {
		return `${y}-${m}-${d}`;
	}

	if (formatStr === "MMM d, yyyy" || formatStr === "MMM dd, yyyy") {
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		const monthName = months[date.getMonth()];
		const dayNum = formatStr === "MMM dd, yyyy" ? d : date.getDate();
		return `${monthName} ${dayNum}, ${y}`;
	}

	// Default: "DD MM YYYY"
	return `${d} ${m} ${y}`;
}
