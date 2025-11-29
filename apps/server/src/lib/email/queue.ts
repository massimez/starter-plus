import { createQueue } from "../redis/queue";
import type { EmailJobData, EmailJobResult } from "./types";

/**
 * Email queue for processing email jobs asynchronously
 * Uses BullMQ with Redis for persistent job storage and retry logic
 */
export const emailQueue = createQueue<EmailJobData, EmailJobResult>("email", {
	defaultJobOptions: {
		attempts: 3,
		backoff: {
			type: "exponential",
			delay: 3000, // Start with 3s, then 6s, 12s
		},
		removeOnComplete: {
			age: 24 * 60 * 60, // Keep completed jobs for 24 hours
			count: 1000, // Keep max 1000 completed jobs
		},
		removeOnFail: {
			age: 7 * 24 * 60 * 60, // Keep failed jobs for 7 days
		},
	},
});
