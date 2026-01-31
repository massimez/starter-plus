export enum EmailJobType {
	VERIFICATION = "verification",
	PASSWORD_RESET = "password_reset",
	WELCOME = "welcome",
	INVITATION = "invitation",
}

export interface VerificationEmailData {
	type: EmailJobType.VERIFICATION;
	email: string;
	otp: string;
}

export interface PasswordResetEmailData {
	type: EmailJobType.PASSWORD_RESET;
	email: string;
	otp: string;
}

export interface WelcomeEmailData {
	type: EmailJobType.WELCOME;
	email: string;
	name: string;
}

export interface InvitationEmailData {
	type: EmailJobType.INVITATION;
	email: string;
	inviterName: string;
	orgName: string;
	link: string;
}

export type EmailJobData =
	| VerificationEmailData
	| PasswordResetEmailData
	| WelcomeEmailData
	| InvitationEmailData;

export interface EmailJobResult {
	success: boolean;
	sentAt: Date;
	error?: string;
}
