import {
	emailOTPClient,
	inferAdditionalFields,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001",
	plugins: [
		organizationClient(),
		emailOTPClient(),
		inferAdditionalFields({
			user: {
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
		}),
	],
});

export const { useSession, useActiveOrganization, signIn, signUp } = authClient;
