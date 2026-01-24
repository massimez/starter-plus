import {
	type Processor,
	Queue,
	type QueueOptions,
	Worker,
	type WorkerOptions,
} from "bullmq";
import { envData } from "@/env";
import { redis } from "./client";

const queuePrefix = `{${envData.REDIS_PREFIX}}`;

export const createQueue = <
	DataType = unknown,
	ResultType = unknown,
	NameType extends string = string,
>(
	name: NameType,
	options?: Omit<QueueOptions, "connection">,
) => {
	return new Queue<DataType, ResultType, NameType>(name, {
		connection: redis, // Reuse ioredis instance
		prefix: queuePrefix,
		...options,
	});
};

export const createWorker = <
	DataType = unknown,
	ResultType = unknown,
	NameType extends string = string,
>(
	name: NameType,
	processor: Processor<DataType, ResultType, NameType>,
	options?: Omit<WorkerOptions, "connection">,
) => {
	return new Worker<DataType, ResultType, NameType>(name, processor, {
		connection: redis, // Reuse ioredis instance
		prefix: queuePrefix,
		...options,
	});
};
