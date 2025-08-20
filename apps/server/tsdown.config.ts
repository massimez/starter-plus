import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		hc: "src/lib/hc.ts",
	},
	dts: {
		resolve: true,
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
