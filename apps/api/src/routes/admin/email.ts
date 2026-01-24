import { createRouter } from "../../lib/create-hono-app";
import {
	cleanEmailJobs,
	getEmailQueueMetrics,
	getFailedEmailJobs,
	retryEmailJob,
} from "../../lib/email";

export const emailRoutes = createRouter()
	.get("/queue/metrics", async (c) => {
		const metrics = await getEmailQueueMetrics();
		return c.json(metrics);
	})
	.get("/queue/failed", async (c) => {
		const start = Number(c.req.query("start")) || 0;
		const end = Number(c.req.query("end")) || 10;
		const failedJobs = await getFailedEmailJobs(start, end);
		return c.json(failedJobs);
	})
	.post("/queue/retry/:id", async (c) => {
		const id = c.req.param("id");
		const success = await retryEmailJob(id);
		if (!success) {
			return c.json({ error: "Job not found or could not be retried" }, 404);
		}
		return c.json({ success: true });
	})
	.post("/queue/clean", async (c) => {
		await cleanEmailJobs();
		return c.json({ success: true });
	});
