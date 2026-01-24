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
		// biome-ignore lint/suspicious/noExplicitAny: <>
		typeof (error as Record<string, any>).message === "string"
	) {
		// biome-ignore lint/suspicious/noExplicitAny: <>
		return (error as Record<string, any>).message;
	}
	return "An unexpected error occurred.";
};

interface BackendError {
	issues: {
		code: string;
		path: (string | number)[];
		message?: string | undefined;
	}[];
	name: string;
}

export const showError = (
	error: unknown,
	// biome-ignore lint/suspicious/noExplicitAny: <>
	toast: any,
	customMessage?: string,
): void => {
	if (
		typeof error === "object" &&
		error !== null &&
		"issues" in error &&
		Array.isArray((error as BackendError).issues) &&
		(error as BackendError).issues.length > 0
	) {
		const backendError = error as BackendError;
		backendError.issues.forEach((issue) => {
			if (toast && typeof toast.error === "function") {
				toast.error(
					issue.message ||
						customMessage ||
						"An unknown backend error occurred.",
				);
			}
		});
	} else {
		const message = getErrorMessage(error);
		toast.error(
			message === "An unexpected error occurred."
				? customMessage || message
				: message,
		);
	}
};

export const handleClientError = async (res: Response): Promise<Error> => {
	const errorData = await res.json();
	const errorMessage = getErrorMessage(errorData);
	return new Error(errorMessage);
};
