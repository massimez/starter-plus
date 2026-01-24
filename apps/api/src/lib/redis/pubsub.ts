import Redis from "ioredis";
import { envData } from "@/env";
import { redis as publisher } from "./client";

// Subscriber needs a dedicated connection
const subscriber = new Redis(envData.REDIS_URL);

export const pubsub = {
	// biome-ignore lint/suspicious/noExplicitAny: <>
	publish: async (channel: string, message: any) => {
		const data =
			typeof message === "object" ? JSON.stringify(message) : String(message);
		return publisher.publish(channel, data);
	},

	// biome-ignore lint/suspicious/noExplicitAny: <>
	subscribe: async (channel: string, callback: (message: any) => void) => {
		await subscriber.subscribe(channel);
		subscriber.on("message", (ch, message) => {
			if (ch === channel) {
				try {
					callback(JSON.parse(message));
				} catch {
					callback(message);
				}
			}
		});
	},
};
