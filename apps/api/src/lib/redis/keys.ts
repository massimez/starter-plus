import { envData } from "@/env";

export const KeyFactory = {
	prefix: envData.REDIS_PREFIX,

	/**
	 * Generates a namespaced key.
	 * Format: {prefix}:{module}:{id}
	 */
	generate(module: string, id: string | number, ...parts: (string | number)[]) {
		return [this.prefix, module, id, ...parts].join(":");
	},

	/**
	 * Common key patterns
	 */
	cache: (key: string) => KeyFactory.generate("cache", key),
	rateLimit: (identifier: string, route: string) =>
		KeyFactory.generate("ratelimit", identifier, route),
	session: (sessionId: string) => KeyFactory.generate("session", sessionId),
	queue: (queueName: string) => KeyFactory.generate("queue", queueName),
};
