import bundleAnalyzer from "@next/bundle-analyzer";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { envData } from "./src/env";

const withNextIntl = createNextIntlPlugin();
const withBundleAnalyzer = bundleAnalyzer({
	enabled: envData.ANALYZE === "true",
});

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			...(envData.REMOTE_PATTERNS ?? []),
			{
				protocol: "https",
				hostname: "storage.finitop.app",
			},
		],
	},
	trailingSlash: false,
	output: "standalone",
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
				],
			},
		];
	},
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
