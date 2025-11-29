import { resend } from "./client";
import {
	getPasswordResetEmailTemplate,
	getVerificationEmailTemplate,
	getWelcomeEmailTemplate,
} from "./templates/auth";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

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
			from: "Acme <onboarding@resend.dev>", // TODO: Update with  domain
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

export const emailService = {
	async sendVerificationEmail(email: string, otp: string) {
		await sendEmailWithRetry(
			email,
			"Verify your email",
			getVerificationEmailTemplate(otp),
		);
	},

	async sendPasswordResetEmail(email: string, otp: string) {
		await sendEmailWithRetry(
			email,
			"Reset your password",
			getPasswordResetEmailTemplate(otp),
		);
	},

	async sendWelcomeEmail(email: string, name: string) {
		await sendEmailWithRetry(email, "Welcome!", getWelcomeEmailTemplate(name));
	},
};
