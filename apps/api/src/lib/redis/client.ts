import Redis from "ioredis";
import { envData } from "@/env";

const redis = new Redis(envData.REDIS_URL, {
	maxRetriesPerRequest: null, // Required for BullMQ
	retryStrategy(times) {
		const delay = Math.min(times * 50, 2000);
		return delay;
	},
	reconnectOnError(err) {
		const targetError = "READONLY";
		if (err.message.includes(targetError)) {
			// Only reconnect when the error starts with "READONLY"
			return true;
		}
		return false;
	},
});

redis.on("error", (err) => {
	console.error("Redis Error:", err);
});

redis.on("connect", () => {
	console.log("Redis Connected");
});

export { redis };
