import { cache } from "./cache";
import { pubsub } from "./pubsub";
import { createQueue, createWorker } from "./queue";
import { rateLimit } from "./rate-limit";

async function runTests() {
	console.log("🚀 Starting Redis Tests...");

	// 1. Test Cache
	console.log("\n1. Testing Cache...");
	await cache.set("test-key", { foo: "bar" }, 10);
	const val = await cache.get("test-key");
	console.log("Cache Get:", val);

	const cached = await cache.remember("remember-key", 10, async () => {
		console.log("  (Factory called)");
		return "fresh-data";
	});
	console.log("Cache Remember (1st):", cached);
	const cached2 = await cache.remember("remember-key", 10, async () => {
		console.log("  (Factory SHOULD NOT be called)");
		return "fresh-data-2";
	});
	console.log("Cache Remember (2nd):", cached2);

	// 2. Test Rate Limit
	console.log("\n2. Testing Rate Limit...");
	const rl1 = await rateLimit("user:123", "api/test", 2, 60);
	console.log("Rate Limit 1:", rl1);
	const rl2 = await rateLimit("user:123", "api/test", 2, 60);
	console.log("Rate Limit 2:", rl2);
	const rl3 = await rateLimit("user:123", "api/test", 2, 60);
	console.log("Rate Limit 3 (Should fail):", rl3);

	// 3. Test Pub/Sub
	console.log("\n3. Testing Pub/Sub...");
	await pubsub.subscribe("test-channel", (msg) => {
		console.log("Received Message:", msg);
	});
	await pubsub.publish("test-channel", { hello: "world" });
	// Give it a moment to receive
	await new Promise((r) => setTimeout(r, 100));

	// 4. Test Queue
	console.log("\n4. Testing Queue...");
	const queue = createQueue("testqueue");
	const worker = createWorker("testqueue", async (job) => {
		console.log("Processing Job:", job.name, job.data);
	});

	await queue.add("testqueue", { some: "data" });
	// Give it a moment to process
	await new Promise((r) => setTimeout(r, 1000));

	await worker.close();
	await queue.close();

	console.log("\n✅ Tests Completed");
	process.exit(0);
}

runTests().catch(console.error);
