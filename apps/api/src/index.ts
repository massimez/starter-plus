import { envData } from "@/env";
import { honoApp } from "./lib/app";
import { emailWorker } from "./lib/email";

const port = envData.PORT;

console.log(`🚀 Server starting on port ${port}`);
console.log(`📧 Email worker started: ${emailWorker.name}`);
console.log(`🌍 Environment: ${envData.NODE_ENV}`);
console.log(`📡 Health check: http://localhost:${port}/api/health`);

export default {
	port,
	fetch: honoApp.fetch,
};
