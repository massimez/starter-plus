import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";
import {
	createErrorResponse,
	createSuccessResponse,
} from "@/lib/utils/route-helpers";

const healthRoutes = createRouter().get("/", async (c) => {
	try {
		// Test database connection
		await db.execute("SELECT 1");

		const healthData = {
			status: "healthy",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			services: {
				database: "connected",
			},
		};

		return c.json(createSuccessResponse(healthData, "All services healthy"));
	} catch (error) {
		console.error("Database connection error:", error);

		return c.json(
			createErrorResponse("ServiceUnavailableError", "Health check failed", [
				{
					code: "DATABASE_CONNECTION_FAILED",
					path: ["services", "database"],
					message: "Unable to connect to database",
				},
			]),
			503,
		);
	}
});

export default healthRoutes;
