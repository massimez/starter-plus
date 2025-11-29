import { emailQueue } from "./queue";

export { emailQueue } from "./queue";
export * from "./types";
export { emailWorker } from "./worker";

/**
 * Get email queue metrics
 */
export const getEmailQueueMetrics = async () => {
	const [waiting, active, completed, failed, delayed] = await Promise.all([
		emailQueue.getWaitingCount(),
		emailQueue.getActiveCount(),
		emailQueue.getCompletedCount(),
		emailQueue.getFailedCount(),
		emailQueue.getDelayedCount(),
	]);

	return {
		waiting,
		active,
		completed,
		failed,
		delayed,
	};
};

/**
 * Get failed email jobs
 */
export const getFailedEmailJobs = async (start = 0, end = 10) => {
	return await emailQueue.getFailed(start, end);
};

/**
 * Retry a failed email job
 */
export const retryEmailJob = async (jobId: string) => {
	const job = await emailQueue.getJob(jobId);
	if (job) {
		await job.retry();
		return true;
	}
	return false;
};

/**
 * Clean old email jobs
 */
export const cleanEmailJobs = async (gracePeriod = 1000 * 60 * 60 * 24 * 7) => {
	// Clean jobs older than 7 days
	await emailQueue.clean(gracePeriod, 1000, "completed");
	await emailQueue.clean(gracePeriod, 1000, "failed");
};
