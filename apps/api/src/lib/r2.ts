// lib/r2.ts

import { S3Client } from "@aws-sdk/client-s3";
import { envData } from "@/env";

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${envData.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		// biome-ignore lint/style/noNonNullAssertion: <>
		accessKeyId: envData.CF_ACCESS_KEY_ID!,
		// biome-ignore lint/style/noNonNullAssertion: <>
		secretAccessKey: envData.CF_SECRET_ACCESS_KEY!,
	},
});
