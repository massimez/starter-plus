import { emailQueue } from "./queue";
import { EmailJobType } from "./types";

/**
 * Email service that enqueues email jobs for asynchronous processing
 * All emails are sent via BullMQ queue for better reliability and performance
 */
export const emailService = {
	async sendVerificationEmail(email: string, otp: string) {
		await emailQueue.add(
			"verification-email",
			{
				type: EmailJobType.VERIFICATION,
				email,
				otp,
			},
			{
				priority: 1, // High priority for verification emails
			},
		);
		console.log(`[Email Service] Enqueued verification email for ${email}`);
	},

	async sendPasswordResetEmail(email: string, otp: string) {
		await emailQueue.add(
			"password-reset-email",
			{
				type: EmailJobType.PASSWORD_RESET,
				email,
				otp,
			},
			{
				priority: 1, // High priority for password reset emails
			},
		);
		console.log(`[Email Service] Enqueued password reset email for ${email}`);
	},

	async sendWelcomeEmail(email: string, name: string) {
		await emailQueue.add(
			"welcome-email",
			{
				type: EmailJobType.WELCOME,
				email,
				name,
			},
			{
				priority: 5, // Lower priority for welcome emails
			},
		);
		console.log(`[Email Service] Enqueued welcome email for ${email}`);
	},

	async sendInvitationEmail(
		email: string,
		inviterName: string,
		orgName: string,
		link: string,
	) {
		await emailQueue.add(
			"invitation-email",
			{
				type: EmailJobType.INVITATION,
				email,
				inviterName,
				orgName,
				link,
			},
			{
				priority: 2, // High priority for invitations
			},
		);
		console.log(`[Email Service] Enqueued invitation email for ${email}`);
	},
};
