import { redis } from "./client";
import { KeyFactory } from "./keys";

export const rateLimit = async (
	identifier: string,
	route: string,
	limit: number,
	windowSeconds: number,
): Promise<{ success: boolean; remaining: number; reset: number }> => {
	const key = KeyFactory.rateLimit(identifier, route);

	const multi = redis.multi();
	multi.incr(key);
	multi.ttl(key);
	const results = await multi.exec();

	if (!results) {
		throw new Error("Redis transaction failed");
	}

	const [incrErr, currentCount] = results[0];
	const [ttlErr, ttl] = results[1];

	if (incrErr || ttlErr) {
		throw new Error("Redis operation failed");
	}

	const count = currentCount as number;
	let currentTtl = ttl as number;

	// If key is new (ttl is -1), set expiration
	if (currentTtl === -1) {
		await redis.expire(key, windowSeconds);
		currentTtl = windowSeconds;
	}

	return {
		success: count <= limit,
		remaining: Math.max(0, limit - count),
		reset: Math.floor(Date.now() / 1000) + currentTtl,
	};
};
