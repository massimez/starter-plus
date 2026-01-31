import { envData } from "@/env";
import { createWorker } from "../redis/queue";
import { resend } from "./client";
import {
	getPasswordResetEmailTemplate,
	getVerificationEmailTemplate,
	getWelcomeEmailTemplate,
} from "./templates/auth";
import { type EmailJobData, type EmailJobResult, EmailJobType } from "./types";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

/**
 * Send email directly using Resend with retry logic
 * This is used by the worker to actually send emails
 */
async function sendEmailWithRetry(
	to: string,
	subject: string,
	html: string,
	retries = 0,
): Promise<void> {
	if (!resend) {
		console.warn("Resend client not initialized. Skipping email send.");
		console.log(`To: ${to}, Subject: ${subject}`);
		return;
	}

	try {
		await resend.emails.send({
			from: envData.EMAIL_FROM || "",
			to,
			subject,
			html,
		});
	} catch (error) {
		if (retries < MAX_RETRIES) {
			console.warn(
				`Failed to send email to ${to}. Retrying (${retries + 1}/${MAX_RETRIES})...`,
			);
			await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
			return sendEmailWithRetry(to, subject, html, retries + 1);
		}
		console.error(
			`Failed to send email to ${to} after ${MAX_RETRIES} retries:`,
			error,
		);
		throw error;
	}
}

/**
 * Email worker that processes email jobs from the queue
 * Handles verification, password reset, and welcome emails
 */
export const emailWorker = createWorker<EmailJobData, EmailJobResult>(
	"email",
	async (job) => {
		const { data } = job;
		const startTime = Date.now();

		console.log(
			`[Email Worker] Processing ${data.type} email job ${job.id} for ${data.email}`,
		);

		try {
			switch (data.type) {
				case EmailJobType.VERIFICATION:
					await sendEmailWithRetry(
						data.email,
						"Verify your email",
						getVerificationEmailTemplate(data.otp),
					);
					break;

				case EmailJobType.PASSWORD_RESET:
					await sendEmailWithRetry(
						data.email,
						"Reset your password",
						getPasswordResetEmailTemplate(data.otp),
					);
					break;

				case EmailJobType.WELCOME:
					await sendEmailWithRetry(
						data.email,
						"Welcome!",
						getWelcomeEmailTemplate(data.name),
					);
					break;

				default: {
					// TypeScript exhaustiveness check
					const _exhaustive: never = data;
					throw new Error(`Unknown email job type: ${JSON.stringify(data)}`);
				}
			}

			const duration = Date.now() - startTime;
			console.log(
				`[Email Worker] Successfully sent ${data.type} email to ${data.email} in ${duration}ms`,
			);

			return {
				success: true,
				sentAt: new Date(),
			};
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error(
				`[Email Worker] Failed to send ${data.type} email to ${data.email} after ${duration}ms:`,
				error,
			);

			return {
				success: false,
				sentAt: new Date(),
				error: error instanceof Error ? error.message : String(error),
			};
		}
	},
	{
		concurrency: 5, // Process up to 5 emails concurrently
		limiter: {
			max: 10, // Max 10 jobs
			duration: 1000, // Per second (respects rate limits)
		},
	},
);

// Worker event listeners for monitoring
emailWorker.on("completed", (job) => {
	console.log(`[Email Worker] Job ${job.id} completed successfully`);
});

emailWorker.on("failed", (job, err) => {
	console.error(
		`[Email Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts:`,
		err.message,
	);
});

emailWorker.on("error", (err) => {
	console.error("[Email Worker] Worker error:", err);
});

console.log("[Email Worker] Email worker initialized and ready");
