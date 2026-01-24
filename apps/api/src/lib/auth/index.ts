import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { admin, emailOTP, organization } from "better-auth/plugins";
import type { GoogleProfile } from "better-auth/social-providers";
import { db } from "../db";
import * as schema from "../db/schema";
import { emailService } from "../email/service";
import { redis } from "../redis";

export const auth = betterAuth({
	trustedOrigins: [
		"http://test.com:3002",
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://localhost:3002",
		"http://alpha.localhost:3002",
		"http://alpha.test.com:3002",
	],
	telemetry: {
		enabled: false,
	},
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
			domain: "test.com",
		},
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

	// Redis secondary storage for sessions and rate limiting
	secondaryStorage: {
		get: async (key) => {
			return await redis.get(key);
		},
		set: async (key, value, ttl) => {
			if (ttl) {
				await redis.set(key, value, "EX", ttl);
			} else {
				await redis.set(key, value);
			}
		},
		delete: async (key) => {
			await redis.del(key);
		},
	},

	plugins: [
		admin(),
		organization(),
		// phoneNumber({
		// 	sendOTP: ({ phoneNumber, code }, _request) => {
		// 		// Implement sending OTP code via SMS
		// 	},
		// }),
		emailOTP({
			sendVerificationOnSignUp: true,
			async sendVerificationOTP({ email, otp, type }) {
				if (type === "sign-in") {
					// Send the OTP for sign in
				} else if (type === "email-verification") {
					console.log(email, otp);
					// await emailService.sendVerificationEmail(email, otp);
				} else {
					await emailService.sendPasswordResetEmail(email, otp);
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
export type User = (typeof auth.$Infer.Session)["user"];
export type Organization = typeof auth.$Infer.Organization;
