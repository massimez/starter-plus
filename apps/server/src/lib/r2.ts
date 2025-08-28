// lib/r2.ts

import { S3Client } from "@aws-sdk/client-s3";
import env from "@/env";

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${env?.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		// biome-ignore lint/style/noNonNullAssertion: <>
		accessKeyId: env?.CF_ACCESS_KEY_ID!,
		// biome-ignore lint/style/noNonNullAssertion: <>
		secretAccessKey: env?.CF_SECRET_ACCESS_KEY!,
	},
});
