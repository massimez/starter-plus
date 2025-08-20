export const getErrorMessage = (error: unknown): string => {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		"statusText" in error
	) {
		return (
			(error as { message: string; statusText: string }).message ||
			(error as { message: string; statusText: string }).statusText ||
			"An unexpected error occurred."
		);
	}
	if (error instanceof Error) {
		return error.message;
	}
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof (error as Record<string, any>).message === "string"
	) {
		return (error as Record<string, any>).message;
	}
	return "An unexpected error occurred.";
};
