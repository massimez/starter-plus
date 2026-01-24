import { redis } from "./client";
import { KeyFactory } from "./keys";

export const cache = {
	async get<T>(key: string): Promise<T | null> {
		const namespacedKey = KeyFactory.cache(key);
		const data = await redis.get(namespacedKey);
		if (!data) return null;
		try {
			return JSON.parse(data) as T;
		} catch {
			return data as unknown as T;
		}
	},

	// biome-ignore lint/suspicious/noExplicitAny: <>
	async set(key: string, value: any, ttl?: number): Promise<void> {
		const namespacedKey = KeyFactory.cache(key);
		const data =
			typeof value === "object" ? JSON.stringify(value) : String(value);
		if (ttl) {
			await redis.set(namespacedKey, data, "EX", ttl);
		} else {
			await redis.set(namespacedKey, data);
		}
	},

	async del(key: string): Promise<void> {
		const namespacedKey = KeyFactory.cache(key);
		await redis.del(namespacedKey);
	},

	/**
	 * Cache-aside pattern: Try to get from cache, otherwise execute factory and cache result.
	 */
	async remember<T>(
		key: string,
		ttl: number,
		factory: () => Promise<T>,
	): Promise<T> {
		const cached = await this.get<T>(key);
		if (cached !== null) return cached;

		const fresh = await factory();
		await this.set(key, fresh, ttl);
		return fresh;
	},
};
