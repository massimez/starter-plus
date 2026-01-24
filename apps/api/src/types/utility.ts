// Common error types
export class AppError extends Error {
	constructor(
		message: string,
		public statusCode = 500,
		public code?: string,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class ValidationError extends AppError {
	constructor(
		message: string,
		public field?: string,
	) {
		super(message, 400, "VALIDATION_ERROR");
	}
}

export class AuthError extends AppError {
	constructor(message = "Unauthorized") {
		super(message, 401, "AUTH_ERROR");
	}
}

export class NotFoundError extends AppError {
	constructor(resource = "Resource") {
		super(`${resource} not found`, 404, "NOT_FOUND");
	}
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type WithoutId<T> = Omit<T, "id">;
