import env from "./env";
import { honoApp } from "./lib/app";

const port = env?.PORT || "3001";

console.log(`🚀 Server starting on port ${port}`);
console.log(`🌍 Environment: ${env?.NODE_ENV}`);
console.log(`📡 Health check: http://localhost:${port}/api/health`);

export default {
	port,
	fetch: honoApp.fetch,
};
