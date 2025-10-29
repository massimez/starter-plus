import { createRouter } from "@/lib/create-hono-app";
import { db } from "@/lib/db";

const healthRoutes = createRouter().get("/health", async (c) => {
	try {
		// Test database connection
		await db.execute("SELECT 1");

		return c.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			version: "1.0.0",
			services: {
				database: "connected",
			},
		});
	} catch (error) {
		console.error("Database connection error:", error);
		return c.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				error: "Database connection failed",
			},
			503,
		);
	}
});

export default healthRoutes;
