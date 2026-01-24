import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		hc: "src/lib/hc/hc.ts",
		schema: "src/lib/hc/schema.ts",
	},
	dts: {
		resolve: false,
		compilerOptions: {
			declaration: true,
			declarationMap: true,
			skipLibCheck: false,
			preserveValueImports: true,
			composite: true,
		},
	},
	minify: process.env?.NODE_ENV === "production",
	clean: true,
});
