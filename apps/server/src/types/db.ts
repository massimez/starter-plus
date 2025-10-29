import type { db } from "@/lib/db";

export type TransactionDb = Parameters<typeof db.transaction>[0] extends (
	tx: infer T,
) => Promise<unknown>
	? T
	: never;
