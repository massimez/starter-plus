import { defineConfig } from "tsdown";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
	entry: ["src/index.ts", "src/schema/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	outDir: "dist",
	clean: true,
	sourcemap: true,
	minify: isProduction,
});
