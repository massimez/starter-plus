import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	admin,
	emailOTP,
	organization,
	phoneNumber,
} from "better-auth/plugins";
import type { GoogleProfile } from "better-auth/social-providers";
import { db } from "../db";
import * as schema from "../db/schema";
export const auth = betterAuth({
	telemetry: {
		enabled: false,
	},
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: schema.user,
			session: schema.session,
			account: schema.account,
			verification: schema.verification,
			organization: schema.organization,
			member: schema.member,
			invitation: schema.invitation,
		},
	}),
	plugins: [
		admin(),
		organization(),
		phoneNumber({
			sendOTP: ({ phoneNumber, code }, _request) => {
				console.log(phoneNumber, code);
				// Implement sending OTP code via SMS
			},
		}),
		emailOTP({
			sendVerificationOnSignUp: true,
			async sendVerificationOTP({ email, otp, type }) {
				if (type === "sign-in") {
					// Send the OTP for sign in
				} else if (type === "email-verification") {
					// Send the OTP for email verification
					console.log(email, "type", type, otp);
				} else {
					// Send the OTP for password reset
					console.log(email, "type", type, otp);
				}
			},
		}),
	],

	user: {
		additionalFields: {
			firstName: {
				type: "string",
				required: false,
			},
			lastName: {
				type: "string",
				required: false,
			},
			birthdate: {
				type: "date",
				required: false,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
	},
	emailVerification: {
		sendOnSignUp: true,
	},
	socialProviders: {
		google: {
			clientId: "GOOGLE_CLIENT_ID",
			clientSecret: "GOOGLE_CLIENT_SECRET",
			mapProfileToUser: (profile: GoogleProfile) => {
				return {
					firstName: profile.given_name,
					lastName: profile.family_name,
				};
			},
		},
	},
});

export type Session = typeof auth.$Infer.Session;
export type Organization = typeof auth.$Infer.Organization;
